const router = require('express').Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');
const { protect, allow } = require('../middleware/auth');

router.get('/organizer', protect, allow('organizer'), async (req, res) => {
  const events = await Event.find({ organizer: req.user._id }).sort({ date: 1 });
  const perEvent = await Promise.all(events.map(async (e) => {
    const registered = await Registration.countDocuments({ event: e._id });
    const attended = await Registration.countDocuments({ event: e._id, attended: true });
    const fb = await Feedback.find({ event: e._id });
    const avgRating = fb.length ? +(fb.reduce((s, f) => s + f.rating, 0) / fb.length).toFixed(1) : null;
    return { id: e._id, title: e.title, capacity: e.capacity, registered, attended, feedbackCount: fb.length, avgRating };
  }));
  const totals = perEvent.reduce((t, e) => ({ events: t.events + 1, registered: t.registered + e.registered, attended: t.attended + e.attended }), { events: 0, registered: 0, attended: 0 });
  totals.attendanceRate = totals.registered ? Math.round((totals.attended / totals.registered) * 100) : 0;
  res.json({ totals, perEvent });
});

module.exports = router;
