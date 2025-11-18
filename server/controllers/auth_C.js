const authService = require('../services/auth_S');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.jwtSecret;

const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

const login = async (req, res, next) => {
    try {
        const { userDetails, studios } = await authService.login(req.body); 
        const tokenPayload = { id: userDetails.id };
        const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '30d' }); 
        
        res.cookie("jwt", token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict', 
            maxAge: ONE_MONTH_IN_MS 
        });

        res.json({ userDetails, studios });
    } catch (err) {
        next(err);
    }
};

const register = async (req, res, next) => {
    try {
        const data = await authService.register(req.body);
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
};

const logout = (req, res) => {
    res.clearCookie("jwt");
    res.status(200).json({ message: "Logged out" });
};

const verify = async (req, res, next) => {
    try {
        const fullUserContext = await authService.verifyUserFromId(req.user.id);
        res.json(fullUserContext);
    } catch (err) {
        next(err);
    }
};

const impersonate = async (req, res, next) => {
    try {
        const ownerId = req.user.id;
        const targetUserId = req.params.userId;

        const { token, userDetails, studios } = await authService.impersonate(ownerId, targetUserId);

        res.cookie("jwt", token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
        
        res.json({ userDetails, studios });
    } catch (err) {
        next(err);
    }
};

const requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        await authService.requestPasswordReset(email); 
        
        res.status(200).json({ message: "קישור לאיפוס סיסמה נשלח לדוא''ל שלך." });
    } catch (err) {
        if (err.status === 404 && err.errorType === 'EMAIL_NOT_FOUND') {
            return res.status(404).json({ message: err.message });
        }
        next(err); 
    }
};
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    await authService.resetPassword(token, newPassword);

    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    next(err); 
  }
};

module.exports = {
    login,
    register,
    logout,
    verify,
    impersonate,
    requestPasswordReset,
    resetPassword
};