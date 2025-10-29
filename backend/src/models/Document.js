const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  pageNumber: Number,
  text: String,
  confidence: Number,
  words: [
    {
      text: String,
      bbox: {
        x: Number,
        y: Number,
        w: Number,
        h: Number
      }
    }
  ],
  ocrStatus: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' }
});

const DocumentSchema = new mongoose.Schema({
  title: String,
  filename: String,
  uploader: { type: String },
  tags: [String],
  mimeType: String,
  size: Number,
  hash: { type: String, index: true },
  pages: [PageSchema],
  status: { type: String, enum: ['queued', 'processing', 'done', 'failed'], default: 'queued' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// textIndex for full-text search across pages
DocumentSchema.index({ 'pages.text': 'text', title: 'text', tags: 'text' }, { default_language: 'none' });

module.exports = mongoose.model('Document', DocumentSchema);
