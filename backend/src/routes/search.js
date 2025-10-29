const express = require('express');
const Document = require('../models/Document');
const router = express.Router();

// GET /api/search?q=&page=1&pageSize=10&tag=foo
router.get('/', async (req, res) => {
  const q = req.query.q || '';
  const page = Math.max(1, parseInt(req.query.page || '1'));
  const pageSize = Math.min(100, parseInt(req.query.pageSize || '10'));
  const tag = req.query.tag;

  const filter = {};
  if (tag) filter.tags = tag;

  let docs, total;
  if (q) {
    // Try Mongo full-text search first (requires a text index).
    // If that returns no results (e.g. index missing or OCR text not yet indexed),
    // fall back to a case-insensitive regex search against page text and title.
    const textFilter = { $text: { $search: q }, ...filter };
    docs = await Document.find(textFilter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();
    total = await Document.countDocuments(textFilter);

    // If text search yields nothing, perform a regex search on pages.text and title
    if ((!docs || docs.length === 0) && q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const regexFilter = { $and: [ { $or: [ { 'pages.text': { $regex: regex } }, { title: { $regex: regex } } ] }, filter ] };
      docs = await Document.find(regexFilter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean();
      total = await Document.countDocuments(regexFilter);
    }
  } else {
    docs = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();
    total = await Document.countDocuments(filter);
  }

  // For highlight snippets we extract small snippet from pages
  docs = docs.map(d => {
    const snippets = [];
    if (d.pages) {
      d.pages.forEach(p => {
        if (p.text && q && p.text.toLowerCase().includes(q.toLowerCase())) {
          const idx = p.text.toLowerCase().indexOf(q.toLowerCase());
          const start = Math.max(0, idx - 60);
          const end = Math.min(p.text.length, idx + 60);
          snippets.push({ pageNumber: p.pageNumber, snippet: p.text.substring(start, end) });
        }
      });
    }
    return { ...d, snippets };
  });

  res.json({ total, page, pageSize, results: docs });
});

module.exports = router;
