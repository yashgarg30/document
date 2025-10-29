const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { createWorker } = Tesseract;

async function preprocessImage(filePath, opts = {}) {
  // basic preprocessing using sharp: resize to reasonable dpi, grayscale, threshold
  const tmp = `${filePath}.proc.png`;
  let img = sharp(filePath).png();
  if (opts.rotate) img = img.rotate(opts.rotate);
  if (opts.deskew) {
    // placeholder: sharp doesn't have deskew; could integrate other libs
  }
  if (opts.denoise) {
    // placeholder: can use median filter via other libs; skipping for now
  }
  img = img.flatten({ background: { r: 255, g: 255, b: 255 } }).greyscale();
  await img.toFile(tmp);
  return tmp;
}

async function ocrImage(filePath, lang = 'eng', logger = () => {}) {
  const worker = createWorker({ logger });
  await worker.load();
  await worker.loadLanguage(lang);
  await worker.initialize(lang);
  const { data } = await worker.recognize(filePath);
  await worker.terminate();
  return data; // includes text, words with bbox, confidence
}

module.exports = { preprocessImage, ocrImage };
