const jwt = require('jsonwebtoken');
const userModel = require('../models/user_M');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const md5 = require('md5'); 

const jwtSecret = process.env.jwtSecret;
const Salt = process.env.Salt; 

const encWithSalt = (str) => md5(Salt + str);

const rateLimiter = new RateLimiterMemory({ points: 6, duration: 3 * 60 });
const checkLoginRateLimit = async (req, res, next) => {
    try {
        await rateLimiter.consume(req.connection.remoteAddress);
        next();
    } catch {
        res.status(429).json({ message: "נסיון כניסה: בוצעו יותר מדי ניסיונות התחברות, אנא נסה שוב מאוחר יותר." });
    }
};

const resetRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 3 * 60 
});
const checkResetRateLimit = async (req, res, next) => {
  try {
    await resetRateLimiter.consume(req.connection.remoteAddress);
    next();
  } catch {
    res.status(429).json({ message: "איפוס סיסמה: בוצעו יותר מדי נסיונות, אנא נסה שוב מאוחר יותר." });
  }
};

const isLoggedIn = async (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) {
        return res.status(401).json({ message: "גישה אסורה: לא סופק טוקן אימות." });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        if (!decoded.id) {
            return res.status(401).json({ message: "אימות נכשל: תוכן טוקן לא חוקי." });
        }

        const [[user]] = await userModel.getById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "משתמש לא נמצא: המשתמש המשויך לטוקן אינו קיים במערכת." });
        }

        const [allUserRoles] = await userModel.findStudiosAndRolesByUserId(user.id);

        const isOwner = allUserRoles.some(roleInfo => roleInfo.role_name === 'owner');

        if (isOwner) {
            req.user = {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                studioId: null,
                roles: ['owner']
            };
            return next();
        }
        
        const studioId = req.headers['x-studio-id'];
        if (!studioId) {
            return res.status(400).json({ message: "בקשה שגויה: נדרש מזהה סטודיו (x-studio-id) עבור משתמש שאינו בעלים." });
        }

        const rolesForStudio = allUserRoles
            .filter(roleInfo => roleInfo.studio_id == studioId)
            .map(roleInfo => roleInfo.role_name);

        if (rolesForStudio.length === 0) {
            return res.status(403).json({ message: "גישה נדחתה: המשתמש אינו משויך לסטודיו הנוכחי." });
        }

        req.user = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            studioId: parseInt(studioId, 10),
            roles: rolesForStudio
        };
        next();
    } catch (err) {
        res.clearCookie("jwt");
        return res.status(401).json({ message: "אימות נכשל: הטוקן אינו חוקי או שפג תוקפו." });
    }
};

const requireRole = (...requiredRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.status(403).json({ message: "גישה נדחתה: פרטי משתמש חסרים בבקשה." });
        }
        
        if (req.user.roles.includes('owner')) {
            return next();
        }

        const hasRole = requiredRoles.some(role => req.user.roles.includes(role));
        if (!hasRole) {
            return res.status(403).json({ message: `הרשאות לא מספקות: נדרשת אחת מההרשאות: ${requiredRoles.join(', ')}.` });
        }
        
        next();
    };
};

module.exports = {
    checkLoginRateLimit,
    checkResetRateLimit,
    isLoggedIn,
    requireRole,
    encWithSalt, 
};