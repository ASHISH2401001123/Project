const router = require('express').Router();
const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { protect, allow } = require('../middleware/auth');

router.use(protect);

router.post('/event/:eventId', allow('participant'), async (req, res) => {
  const reg = await Registration.findOne({ event: req.params.eventId, user: req.user._id, attended: true });
  if (!reg) return res.status(403).json({ message: 'Only attendees can leave feedback' });
  if (await Feedback.findOne({ event: req.params.eventId, user: req.user._id }))
    return res.status(409).json({ message: 'You already submitted feedback' });
  res.status(201).json(await Feedback.create({ event: req.params.eventId, user: req.user._id, rating: req.body.rating, comment: req.body.comment }));
});

router.get('/event/:eventId', allow('organizer'), async (req, res) => {
  const e = await Event.findById(req.params.eventId);
  if (!e || String(e.organizer) !== String(req.user._id)) return res.status(403).json({ message: 'Not your event' });
  res.json(await Feedback.find({ event: e._id }).populate('user', 'name').sort({ createdAt: -1 }));
});

module.exports = router;
