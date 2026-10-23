const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('../utils/appError');

const uploadDirectory = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const mimeExtensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (request, file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${mimeExtensions[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (request, file, callback) => {
    if (!mimeExtensions[file.mimetype]) return callback(new AppError('Upload a JPG, PNG, or WebP image only.'));
    callback(null, true);
  },
});

module.exports = upload;
