export function shabbatBlocker(req, res, next) {
  const now = new Date();
  const dayOfWeek = now.getDay(); 

  if (dayOfWeek === 6) {
    return res.status(503).json({ 
      message: 'האתר סגור לפעילות בימי שבת. נשמח לשרתכם במוצאי השבת.' 
    });
  }

  next();
}