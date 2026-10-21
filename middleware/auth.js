import jwt from 'jsonwebtoken';
import AppError from './AppError.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'גישה דחויה, חסר אסימון אימות'));
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) return next(error);
    req.user = decoded;
    next();
  });
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, error => {
    if (error) return next(error);
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      next(new AppError(403, 'פעולה זו מורשת למנהלים בלבד'));
    }
  });
};