const mongoose = require('mongoose');
module.exports = mongoose.model('Event', new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['technical', 'workshop', 'hackathon'], default: 'technical' },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  capacity: { type: Number, default: 100 },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  volunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true }));
