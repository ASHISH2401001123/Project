const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
}, { timestamps: true });
schema.index({ event: 1, user: 1 }, { unique: true });
module.exports = mongoose.model('Feedback', schema);
