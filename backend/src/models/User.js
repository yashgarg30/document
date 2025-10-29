const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ['user','admin'], default: 'user' }
});

UserSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
}

module.exports = mongoose.model('User', UserSchema);
