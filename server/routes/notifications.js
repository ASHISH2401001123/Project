const router = require('express').Router();
const Notification = require('../models/Notification');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect, allow } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => res.json(await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30)));

router.put('/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true }); res.json({ ok: true });
});

// Organizer announcement to everyone registered for an event
router.post('/broadcast/:eventId', allow('organizer'), async (req, res) => {
  const e = await Event.findById(req.params.eventId);
  if (!e || String(e.organizer) !== String(req.user._id)) return res.status(403).json({ message: 'Not your event' });
  if (!req.body.message) return res.status(400).json({ message: 'Write a message first' });
  const regs = await Registration.find({ event: e._id });
  await Notification.insertMany(regs.map((r) => ({ user: r.user, event: e._id, title: `Update: ${e.title}`, message: req.body.message })));
  res.json({ message: `Sent to ${regs.length} participant(s)` });
});

module.exports = router;
