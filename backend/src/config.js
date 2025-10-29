const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mern_ocr',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads'),
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  tesseract: {
    langPath: process.env.TESSDATA_PREFIX || undefined
  }
};
