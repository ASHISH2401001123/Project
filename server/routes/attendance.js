const router = require('express').Router();
const Registration = require('../models/Registration');
const Notification = require('../models/Notification');
const { protect, allow } = require('../middleware/auth');

// Scan a ticket QR (or typed code) to mark attendance
router.post('/scan', protect, allow('volunteer', 'organizer'), async (req, res) => {
  const reg = await Registration.findOne({ ticketCode: (req.body.ticketCode || '').trim() })
    .populate('event').populate('user', 'name email');
  if (!reg) return res.status(404).json({ message: 'Invalid ticket' });
  const e = reg.event, uid = String(req.user._id);
  const allowed = String(e.organizer) === uid || e.volunteers.some((v) => String(v) === uid);
  if (!allowed) return res.status(403).json({ message: 'You are not assigned to this event' });
  if (reg.attended) return res.status(409).json({ message: `${reg.user.name} was already checked in` });
  reg.attended = true; reg.attendedAt = new Date(); reg.checkedBy = req.user._id; await reg.save();
  await Notification.create({ user: reg.user._id, event: e._id, title: 'Checked in', message: `Attendance marked for ${e.title}. Your certificate is ready to download.` });
  res.json({ message: `${reg.user.name} checked in to ${e.title}` });
});

module.exports = router;
