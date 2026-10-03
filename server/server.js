require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on :${PORT}`)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
