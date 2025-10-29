const Queue = require('bull');
const mongoose = require('mongoose');
const config = require('../config');
const Document = require('../models/Document');
const socket = require('../socket');
const { preprocessImage, ocrImage } = require('./ocrService');

// MongoDB connection with retry logic
async function connectMongo() {
  try {
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 1000,
    });
    console.log('MongoDB connected in worker');
  } catch (err) {
    console.error('MongoDB connection error in worker:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectMongo, 5000);
  }
}

// Initial connection
connectMongo();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');

const ocrQueue = new Queue('ocr', config.redisUrl);

// Note: For PDFs we rely on "pdftoppm" if available (poppler), otherwise you must implement PDF page extraction.
// This worker is intentionally minimal and can be extended to use pdf-lib or pdf-poppler.

async function extractPagesFromPdf(filePath) {
  // write to temp dir using pdftoppm (poppler) if present
  const dir = path.dirname(filePath);
  const outPrefix = path.join(dir, path.basename(filePath));
  const cmd = 'pdftoppm';
  return new Promise((resolve, reject) => {
    const args = ['-png', filePath, outPrefix];
    const p = spawn(cmd, args);
    p.on('error', (err) => reject(err));
    p.on('close', (code) => {
      if (code !== 0) return reject(new Error('pdftoppm failed'));
      // collect generated files
      const files = fs.readdirSync(dir).filter(f => f.startsWith(path.basename(filePath)) && f.endsWith('.png')).map(f => path.join(dir,f)).sort();
      resolve(files);
    });
  });
}

ocrQueue.process(1, async (job, done) => {
  console.log('Processing job:', job.data);
  const { documentId, path: filePath, originalName, lang } = job.data;
  const io = socket.get();
  try {
    console.log('Finding document:', documentId);
    const doc = await Document.findById(documentId);
    if (!doc) throw new Error('Document not found');
    console.log('Document found:', doc.title);
    doc.status = 'processing';
    await doc.save();

    let pages = [];
    if (doc.mimeType === 'application/pdf') {
      // try external conversion
      let imgs;
      try {
        imgs = await extractPagesFromPdf(filePath);
      } catch (err) {
        // fallback: treat entire PDF as one blob (not ideal)
        imgs = [filePath];
      }
      pages = imgs;
    } else {
      pages = [filePath];
    }

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      console.log(`Processing page ${i+1}`);
      io && io.to(`doc:${documentId}`).emit('page', { page: i+1, status: 'processing' });
      // preprocess
      console.log('Preprocessing image...');
      const proc = await preprocessImage(p, { denoise: true });
      console.log('Preprocessing complete');
      const data = await ocrImage(proc, lang, m => {
        io && io.to(`doc:${documentId}`).emit('ocrLog', { page: i+1, msg: m });
      });
      // map words
      const words = data.words.map(w => ({ text: w.text, bbox: { x: w.bbox.x0, y: w.bbox.y0, w: w.bbox.x1-w.bbox.x0, h: w.bbox.y1-w.bbox.y0 } }));
      doc.pages.push({ pageNumber: i+1, text: data.text, confidence: data.confidence || 0, words, ocrStatus: 'done' });
      doc.updatedAt = new Date();
      await doc.save();
      io && io.to(`doc:${documentId}`).emit('page', { page: i+1, status: 'done', confidence: data.confidence || 0 });
      // remove processed tmp
      if (proc !== p && fs.existsSync(proc)) fs.unlinkSync(proc);
    }

    doc.status = 'done';
    await doc.save();
    io && io.to(`doc:${documentId}`).emit('done', { documentId });

    // cleanup: remove original file (optional)
    try { fs.unlinkSync(filePath); } catch(e) {}
    done();
  } catch (err) {
    console.error('OCR job failed', err);
    try { await Document.findByIdAndUpdate(documentId, { status: 'failed' }); } catch(e){}
    const io = socket.get();
    io && io.to(`doc:${documentId}`).emit('failed', { error: err.message });
    done(err);
  }
});

console.log('OCR worker started, listening to queue');

ocrQueue.on('failed', (job, err) => console.error('job failed', job.id, err));
