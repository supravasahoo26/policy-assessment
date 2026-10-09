const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { importFile } = require('../services/importService');

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 25 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = /\.(xlsx|xls|csv)$/i.test(file.originalname);
  cb(allowed ? null : new Error('Only XLSX, XLS or CSV files are allowed'), allowed);
} });

router.post('/', upload.single('file'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: 'file is required' });
  try {
    const result = await importFile(req.file.path);
    fs.unlink(req.file.path, () => {});
    res.status(201).json({ message: 'File imported successfully', ...result });
  } catch (error) {
    fs.unlink(req.file.path, () => {});
    next(error);
  }
});

module.exports = router;
