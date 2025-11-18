const { encWithSalt } = require('../middlewares/auth_Midd');
const userModel = require('../models/user_M');
const studioModel = require('../models/studio_M');
const sendEmail = require('../utils/sendEmail'); 
const jwt = require('jsonwebtoken'); 
const jwtSecret = process.env.jwtSecret; 
const jwtResetSecret = process.env.JWT_RESET_SECRET; 

const login = async ({ userName, pass }) => {
    const user = await userModel.getByUserName(userName);
    
    if (!user) {
        const error = new Error("שם משתמש לא קיים במערכת");
        error.status = 401; 
        error.errorType = 'USER_NOT_FOUND'; 
        throw error;
    }
    
    if (user.password_hash !== encWithSalt(pass)) {
        const error = new Error("הסיסמה שהוזנה שגויה");
        error.status = 401; 
        error.errorType = 'INCORRECT_PASSWORD';
        throw error;
    }
    
    const [studiosAndRoles] = await userModel.findStudiosAndRolesByUserId(user.id);
    const { password_hash, ...userDetails } = user;
    
    return { userDetails, studios: studiosAndRoles };
};

const verifyUserFromId = async (userId) => {
    const [[user]] = await userModel.getById(userId);
    if (!user) {
        const error = new Error("User not found for verification");
        error.status = 401;
        throw error;
    }

    const [studiosAndRoles] = await userModel.findStudiosAndRolesByUserId(user.id);
    const { password_hash, ...userDetails } = user;

    return { userDetails, studios: studiosAndRoles };
};

const register = async (userData) => {
    const { studio_name, admin_full_name, email, password, userName } = userData;

    if (!studio_name || !admin_full_name || !email || !password || !userName) {
        const error = new Error("שם סטודיו, שם מלא, אימייל, שם משתמש וסיסמה הם שדות חובה.");
        error.status = 400; 
        throw error;
    }
    
    const existingEmail = await userModel.getByEmail(email);
    if (existingEmail) {
        const error = new Error("כתובת האימייל הזו כבר רשומה במערכת");
        error.status = 409; 
        error.field = 'email'; 
        throw error;
    }

    const existingUserName = await userModel.getByUserName(userName);
    if (existingUserName) {
        const error = new Error("שם המשתמש שבחרת תפוס, נסה שם אחר.");
        error.status = 409; 
        error.field = 'userName'; 
        throw error;
    }

    const existingStudio = await studioModel.getByName(studio_name);
    if (existingStudio) {
        const error = new Error("סטודיו בשם זה כבר קיים במערכת");
        error.status = 409; 
        error.field = 'studio_name'; 
        throw error;
    }

    const password_hash = encWithSalt(password);
    
    return studioModel.createStudioWithNewAdmin({
        studio_name,
        admin_full_name,
        email,
        password_hash,
        userName
    });
};

const impersonate = async (ownerId, targetUserId) => {
    const [ownerRoles] = await userModel.findStudiosAndRolesByUserId(ownerId);
    const isOwner = ownerRoles.some(roleInfo => roleInfo.role_name === 'owner');
    if (!isOwner) {
        const error = new Error("Only an owner can perform this action.");
        error.status = 403;
        throw error;
    }

    if (ownerId === targetUserId) {
        const error = new Error("Cannot impersonate yourself.");
        error.status = 400;
        throw error;
    }
    
    const { userDetails, studios } = await verifyUserFromId(targetUserId).catch(err => {
        if (err.status === 401) {
            const error = new Error("Target user not found.");
            error.status = 400;
            throw error;
        }
        throw err;
    });

    const tokenPayload = { id: userDetails.id, isImpersonating: true };
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });
    return { token, userDetails, studios };
};

const requestPasswordReset = async (email) => {
  const user = await userModel.getByEmail(email);

  if (!user) {
    const error = new Error("כתובת האימייל שהוזנה לא קיימת במערכת.");
    error.status = 404;
    error.errorType = 'EMAIL_NOT_FOUND';
    throw error;
  }

  try {
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      jwtResetSecret, 
      { expiresIn: '15m' } 
    );

    const clientUrl = process.env.BASE_URL || 'http://localhost:3000'; 
    const resetLink = `${clientUrl}/reset-password/${resetToken}`;

    const subject = 'FiTime - בקשה לאיפוס סיסמה';
    const html = `
      <h1>שלום ${user.full_name || 'משתמש'},</h1>
      <p>קיבלנו בקשה לאיפוס הסיסמה בחשבונך באתר FiTime.</p>
      <p>כדי לאפס את הסיסמה, אנא לחץ על הקישור הבא (הקישור תקף ל-15 דקות):</p>
      <a href="${resetLink}" style="padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        אפס סיסמה
      </a>
      <p>אם לא ביקשת איפוס, אנא התעלם מהודעה זו.</p>
    `;

    await sendEmail(user.email, subject, html);

    return;

  } catch (err) {
    console.error('Error in requestPasswordReset service:', err);
    
    const error = new Error('שגיאה פנימית בשליחת האימייל לאיפוס. אנא נסה שוב מאוחר יותר.');
    error.status = 500;
    throw error; 
  }
};

const resetPassword = async (token, newPassword) => {
  try {
    const decoded = jwt.verify(token, jwtResetSecret);

    if (!decoded.id) {
      const error = new Error("Invalid token payload.");
      error.status = 400;
      throw error;
    }

    const hashedPassword = encWithSalt(newPassword);

    await userModel.updatePassword(decoded.id, hashedPassword);

    return;

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      const error = new Error("הקישור פג תוקף. אנא בקש איפוס סיסמה חדש.");
      error.status = 401;
      throw error;
    }
    if (err.name === 'JsonWebTokenError') {
      const error = new Error("הקישור אינו תקין.");
      error.status = 401;
      throw error;
    }
    throw err;
  }
};

module.exports = {
    login,
    register,
    verifyUserFromId,
    impersonate,
    requestPasswordReset,
    resetPassword
};