import AppError from './AppError.js';

export function shabbatBlocker(req, res, next) {
  const now = new Date();
  const dayOfWeek = now.getDay(); 

  if (dayOfWeek === 6) {
    return next(new AppError(503, 'האתר סגור לפעילות בימי שבת. נשמח לשרתכם במוצאי השבת.'));
  }

  next();
}