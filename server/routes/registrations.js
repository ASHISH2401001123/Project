const router = require('express').Router();
const crypto = require('crypto');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Notification = require('../models/Notification');
const { protect, allow } = require('../middleware/auth');

router.use(protect);

// Register for an event (participants)
router.post('/event/:eventId', allow('participant'), async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (await Registration.findOne({ event: event._id, user: req.user._id }))
    return res.status(409).json({ message: 'You are already registered' });
  if (await Registration.countDocuments({ event: event._id }) >= event.capacity)
    return res.status(400).json({ message: 'This event is full' });
  const reg = await Registration.create({ event: event._id, user: req.user._id, ticketCode: crypto.randomUUID() });
  await Notification.create({ user: req.user._id, event: event._id, title: 'Registration confirmed', message: `You're registered for ${event.title}. Your ticket is in your dashboard.` });
  res.status(201).json(reg);
});

router.get('/mine', async (req, res) => {
  res.json(await Registration.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('event', 'title date venue type'));
});

// Participant list (organizer owner or assigned volunteer)
router.get('/event/:eventId', allow('organizer', 'volunteer'), async (req, res) => {
  const event = await Event.findById(req.params.eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const ok = String(event.organizer) === String(req.user._id) || event.volunteers.some((v) => String(v) === String(req.user._id));
  if (!ok) return res.status(403).json({ message: 'Not your event' });
  res.json(await Registration.find({ event: event._id }).populate('user', 'name email').sort({ createdAt: 1 }));
});

const mine = async (req, res) => {
  const reg = await Registration.findById(req.params.id).populate('event').populate('user', 'name email');
  if (!reg || String(reg.user._id) !== String(req.user._id)) { res.status(404).json({ message: 'Registration not found' }); return null; }
  return reg;
};

// Ticket with QR code
router.get('/:id/ticket', async (req, res) => {
  const reg = await mine(req, res); if (!reg) return;
  const qr = await QRCode.toDataURL(reg.ticketCode, { width: 300, margin: 1 });
  res.json({ ticketCode: reg.ticketCode, qr, attended: reg.attended, event: reg.event, user: reg.user });
});

// Certificate PDF (only after attendance is marked)
router.get('/:id/certificate', async (req, res) => {
  const reg = await mine(req, res); if (!reg) return;
  if (!reg.attended) return res.status(403).json({ message: 'Certificate is available after your attendance is marked' });
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${reg._id}.pdf"`);
  doc.pipe(res);
  const w = doc.page.width, h = doc.page.height;
  doc.rect(25, 25, w - 50, h - 50).lineWidth(3).stroke('#1f3a5f');
  doc.rect(35, 35, w - 70, h - 70).lineWidth(1).stroke('#c9a227');
  doc.fillColor('#1f3a5f').font('Helvetica-Bold').fontSize(38).text('Certificate of Participation', 0, 110, { align: 'center' });
  doc.fillColor('#444').font('Helvetica').fontSize(16).text('This is to certify that', 0, 190, { align: 'center' });
  doc.fillColor('#c9a227').font('Helvetica-Bold').fontSize(34).text(reg.user.name, 0, 225, { align: 'center' });
  doc.fillColor('#444').font('Helvetica').fontSize(16).text(`has successfully participated in the ${reg.event.type}`, 0, 290, { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(24).fillColor('#1f3a5f').text(reg.event.title, 0, 320, { align: 'center' });
  doc.font('Helvetica').fontSize(14).fillColor('#444').text(`held on ${new Date(reg.event.date).toDateString()} at ${reg.event.venue}`, 0, 365, { align: 'center' });
  doc.fontSize(10).fillColor('#888').text(`Certificate ID: ${reg._id}`, 0, h - 80, { align: 'center' });
  doc.end();
});

router.delete('/:id', async (req, res) => {
  const reg = await mine(req, res); if (!reg) return;
  if (reg.attended) return res.status(400).json({ message: 'Cannot cancel after attending' });
  await reg.deleteOne(); res.json({ message: 'Registration cancelled' });
});

module.exports = router;
