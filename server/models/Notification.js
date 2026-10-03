const mongoose = require('mongoose');
module.exports = mongoose.model('Notification', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
}, { timestamps: true }));
