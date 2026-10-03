const router = require('express').Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { protect, allow } = require('../middleware/auth');

const withCounts = async (events) => Promise.all(events.map(async (e) => ({
  ...e.toObject(), registered: await Registration.countDocuments({ event: e._id }),
})));

router.get('/', async (req, res) => {
  res.json(await withCounts(await Event.find().sort({ date: 1 }).populate('organizer', 'name')));
});

// Events for the logged-in organizer / assigned volunteer
router.get('/mine', protect, allow('organizer', 'volunteer'), async (req, res) => {
  const q = req.user.role === 'organizer' ? { organizer: req.user._id } : { volunteers: req.user._id };
  res.json(await withCounts(await Event.find(q).sort({ date: 1 }).populate('volunteers', 'name email')));
});

router.get('/:id', async (req, res) => {
  const e = await Event.findById(req.params.id).populate('organizer', 'name');
  if (!e) return res.status(404).json({ message: 'Event not found' });
  res.json((await withCounts([e]))[0]);
});

router.post('/', protect, allow('organizer'), async (req, res) => {
  res.status(201).json(await Event.create({ ...req.body, organizer: req.user._id, volunteers: [] }));
});

const owned = async (req, res) => {
  const e = await Event.findById(req.params.id);
  if (!e) { res.status(404).json({ message: 'Event not found' }); return null; }
  if (String(e.organizer) !== String(req.user._id)) { res.status(403).json({ message: 'Not your event' }); return null; }
  return e;
};

router.put('/:id', protect, allow('organizer'), async (req, res) => {
  const e = await owned(req, res); if (!e) return;
  const { title, description, type, date, venue, capacity } = req.body;
  Object.assign(e, { title, description, type, date, venue, capacity });
  await e.save(); res.json(e);
});

router.delete('/:id', protect, allow('organizer'), async (req, res) => {
  const e = await owned(req, res); if (!e) return;
  await Registration.deleteMany({ event: e._id }); await e.deleteOne(); res.json({ message: 'Event deleted' });
});

router.post('/:id/volunteers', protect, allow('organizer'), async (req, res) => {
  const e = await owned(req, res); if (!e) return;
  const v = await User.findOne({ email: (req.body.email || '').toLowerCase(), role: 'volunteer' });
  if (!v) return res.status(404).json({ message: 'No volunteer account with that email' });
  if (!e.volunteers.some((x) => String(x) === String(v._id))) { e.volunteers.push(v._id); await e.save(); }
  res.json({ message: `${v.name} added as volunteer` });
});

module.exports = router;
