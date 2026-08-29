import fs from 'fs';
import path from 'path';

export const customLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl}\n`;

  if (process.env.NODE_ENV === 'production') {
    fs.appendFile(path.join(process.cwd(), 'server.log'), logMessage, (err) => {
      if (err) console.error('שגיאה בכתיבה לקובץ הלוג:', err);
    });
  } else {
    console.log(logMessage.trim());
  }
  next();
};