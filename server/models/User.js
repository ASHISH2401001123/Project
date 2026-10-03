const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['organizer', 'volunteer', 'participant'], default: 'participant' },
}, { timestamps: true });
schema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
  next();
});
schema.methods.matches = function (pw) { return bcrypt.compare(pw, this.password); };
module.exports = mongoose.model('User', schema);
