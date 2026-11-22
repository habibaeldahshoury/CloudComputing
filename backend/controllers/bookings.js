const bookingService = require('../services/bookingService');
const donorService = require('../services/donorService'); // Student 2
const driveService = require('../services/driveService'); // Student 1
const emailService = require('../services/emailService'); // Student 3
const outcomes = new Set(['attended', 'no_show']);
function sendError(res, status, code, message) {
return res.status(status).json({ error: { code, message } });
}
function requireJson(req, res) {
if (!req.is('application/json')) {
sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
return false;
}
return true;
}
// POST /api/bookings (donor)
async function createBooking(req, res, next) {
try {
if (!requireJson(req, res)) return;
const { driveId, slotId } = req.body;
if (!bookingService.isUuid(driveId) || !bookingService.isUuid(slotId)) {
return sendError(res, 400, 'VALIDATION_ERROR', 'driveId and slotId must be valid ids.');
}
const donorId = req.user.id;
// Rule 1: the donor needs a profile and must be eligible (Student 2)
const eligibility = await donorService.getEligibility(donorId);
if (!eligibility) {
return sendError(res, 404, 'DONOR_NOT_FOUND', 'Create your donor profile first.');
}
if (!eligibility.eligible) {
return sendError(res, 403, 'NOT_ELIGIBLE', `You can donate again on
${eligibility.nextEligibleDate}.`);
}

// Rule 2: one active booking per drive
if (await bookingService.findActiveBooking(donorId, driveId)) {
return sendError(res, 409, 'ALREADY_BOOKED', 'You already have abooking in this drive.');
}
// Rule 3: take a seat (Student 1)
const seat = await driveService.reserveSeat(driveId, slotId);
if (!seat.ok) {
if (seat.reason === 'NOT_FOUND') {
return sendError(res, 404, 'SLOT_NOT_FOUND', 'Drive or time slot not found.');
}
if (seat.reason === 'DRIVE_CLOSED') {
return sendError(res, 409, 'DRIVE_CLOSED', 'This drive is not open for booking.');
}
return sendError(res, 409, 'SLOT_FULL', 'This time slot is full.');
}
// Save the booking. If that fails, give the seat back.
let booking;
try {
booking = await bookingService.createBooking(donorId, driveId, slotId);
} catch (error) {
await driveService.releaseSeat(slotId);
if (error.code === '23505') { // the unique index caught a double
booking
return sendError(res, 409, 'ALREADY_BOOKED', 'You already have a booking in this drive.');
}
throw error;
}
await bookingService.createReminder(booking.id);
// A failed email must never undo a successful booking.
try {
const info = await bookingService.getEmailInfo(booking.id);
await emailService.sendConfirmationEmail(info);
} catch (error) {
console.error('Confirmation email failed:', error.message);
}

res.status(201).json(booking);
} catch (error) {
next(error);
}
}
// GET /api/bookings/me (donor)
async function listMyBookings(req, res, next) {
try {
res.status(200).json(await bookingService.listMyBookings(req.user.id));
} catch (error) {
next(error);
}
}
// GET /api/bookings?driveId=... (organizer who owns the drive)
async function listDriveBookings(req, res, next) {
try {
const driveId = req.query.driveId;
if (!bookingService.isUuid(driveId)) {
return sendError(res, 400, 'VALIDATION_ERROR', 'driveId is required and must be a valid id.');
}
const drive = await driveService.getDrive(driveId);
if (!drive) return sendError(res, 404, 'DRIVE_NOT_FOUND', 'Drive not found.');
if (drive.organizerId !== req.user.id) {
return sendError(res, 403, 'FORBIDDEN', 'You can only see bookings of your own drives.');
}
res.status(200).json(await bookingService.listDriveBookings(driveId));
} catch (error) {
next(error);
}
}
// DELETE /api/bookings/:id (the donor who owns it, or the drive's organizer)
async function cancelBooking(req, res, next) {
try {
const booking = await bookingService.getBooking(req.params.id);
if (!booking) return sendError(res, 404, 'BOOKING_NOT_FOUND', 'Booking not found.');
if (req.user.role === 'donor' && booking.donorId !== req.user.id) {
return sendError(res, 403, 'FORBIDDEN', 'You can only cancel your own bookings.');
}
if (req.user.role === 'organizer') {
const drive = await driveService.getDrive(booking.driveId);
if (!drive || drive.organizerId !== req.user.id) {
return sendError(res, 403, 'FORBIDDEN', 'You can only cancel bookings of your own drives.');
}
}
const cancelled = await bookingService.cancelBooking(booking.id);
if (!cancelled) {
return sendError(res, 409, 'NOT_CANCELLABLE', 'Only a booking that is still booked can be cancelled.');
}
await driveService.releaseSeat(cancelled.slotId);
res.status(204).send();
} catch (error) {
next(error);
}
}
// POST /api/bookings/:id/check-in (organizer who owns the drive)
async function checkIn(req, res, next) {
try {
if (!requireJson(req, res)) return;
const { outcome } = req.body;
if (!outcomes.has(outcome)) {
return sendError(res, 400, 'VALIDATION_ERROR', 'outcome must be attended or no_show.');
}
const booking = await bookingService.getBooking(req.params.id);
if (!booking) return sendError(res, 404, 'BOOKING_NOT_FOUND', 'Booking not found.');
const drive = await driveService.getDrive(booking.driveId);
if (!drive || drive.organizerId !== req.user.id) {
return sendError(res, 403, 'FORBIDDEN', 'You can only check in bookings of your own drives.');
}
const updated = await bookingService.checkIn(booking.id, outcome);
if (!updated) {
return sendError(res, 409, 'ALREADY_PROCESSED', 'This booking was already checked in or cancelled.');
}
// Business rule: an attended booking becomes a donation (Student 2)
if (outcome === 'attended') {
await donorService.recordDonation({
donorId: updated.donorId,
driveId: updated.driveId,
bookingId: updated.id
});
}
res.status(200).json(updated);
} catch (error) {
next(error);
}
}
module.exports = { createBooking, listMyBookings, listDriveBookings,
cancelBooking, checkIn };
