const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const out = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password, role: ['organizer', 'volunteer', 'participant'].includes(role) ? role : 'participant' });
  res.status(201).json({ token: sign(user), user: out(user) });
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!user || !(await user.matches(req.body.password || ''))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: sign(user), user: out(user) });
});

router.get('/me', protect, (req, res) => res.json({ user: out(req.user) }));
module.exports = router;
