const crypto = require('crypto');
const fs = require('fs');

function fileHash(path) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const rs = fs.createReadStream(path);
    rs.on('error', reject);
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
  });
}

module.exports = { fileHash };
