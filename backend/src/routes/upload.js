const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileHash } = require('../utils/hash');
const Document = require('../models/Document');
const Queue = require('bull');
const config = require('../config');

const upload = multer({
  dest: "config.uploadDir",
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const ocrQueue = new Queue('ocr', config.redisUrl);

const router = express.Router();

// POST /api/upload
router.post('/config.uploadDir', upload.single('file'), async (req, res) => {
  const f = req.file;
  if (!f) return res.status(400).json({ error: 'No file uploaded' });

  // Basic MIME/type checks
  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/tiff'];
  if (!allowed.includes(f.mimetype)) {
    fs.unlinkSync(f.path);
    return res.status(400).json({ error: 'Unsupported file type' });
  }

  const hash = await fileHash(f.path);
  const dup = await Document.findOne({ hash });
  if (dup) {
    // remove temp file
    fs.unlinkSync(f.path);
    return res.status(200).json({ message: 'Duplicate', documentId: dup._id });
  }

  const doc = new Document({
    title: req.body.title || f.originalname,
    filename: f.filename,
    mimeType: f.mimetype,
    size: f.size,
    hash,
    status: 'queued'
  });
  await doc.save();

  // enqueue for OCR with metadata
  await ocrQueue.add({ documentId: doc._id.toString(), path: f.path, originalName: f.originalname, lang: req.body.lang || 'eng' });

  res.json({ documentId: doc._id, status: 'queued' });
});

module.exports = router;
