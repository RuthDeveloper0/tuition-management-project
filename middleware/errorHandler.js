import multer from 'multer';

export default function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message;
  let details = error.details;

  if (error instanceof multer.MulterError) {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = error.message;
  } else if (error.isJoi) {
    statusCode = 400;
    message = 'הנתונים שנשלחו אינם תקינים';
    details = error.details.map(detail => detail.message);
  } else if (error.name === 'CastError') {
    statusCode = 400;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    details = Object.values(error.errors).map(validationError => validationError.message);
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'הנתון כבר קיים במערכת';
  } else if (error.code === 'ENOENT') {
    statusCode = 404;
    message = 'הקובץ לא נמצא בשרת';
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 403;
    message = 'אסימון אימות לא תקין או פג תוקף';
  }

  if (statusCode >= 500) {
    console.error('Unhandled Error:', error.stack || error);
    message = 'שגיאת שרת פנימית';
  }

  return res.status(statusCode).json({
    message,
    ...(details ? { details } : {})
  });
}