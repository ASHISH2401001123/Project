const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticketCode: { type: String, required: true, unique: true },
  attended: { type: Boolean, default: false },
  attendedAt: Date,
  checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
schema.index({ event: 1, user: 1 }, { unique: true });
module.exports = mongoose.model('Registration', schema);
