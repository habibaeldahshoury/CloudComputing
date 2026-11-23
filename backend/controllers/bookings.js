const bookingService = require('../services/bookingService');
const driveService = require('../services/driveService');
const donorService = require('../services/donorService');
const queue = require('../services/queueService');
const reportService = require('../services/reportService');

const fail = (res, status, code, message) => res.status(status).json({ error: { code, message } });
const today = () => new Date().toISOString().slice(0, 10);
const isId = (v) => Number.isInteger(v) && v > 0;

const reasonToError = {
  NOT_FOUND:      [404, 'NOT_FOUND', 'Drive or slot not found.'],
  FULL:           [409, 'SLOT_FULL', 'This time slot is full. Please choose another.'],
  DRIVE_CLOSED:   [409, 'DRIVE_CLOSED', 'This drive is not open for booking.'],
  ALREADY_BOOKED: [409, 'ALREADY_BOOKED', 'You already have a booking for this drive.']
};

// POST /api/bookings   body: { driveId, slotId }
exports.create = async (req, res, next) => {
  try {
    const { driveId, slotId } = req.body || {};
    if (!isId(driveId) || !isId(slotId)) {
      return fail(res, 400, 'VALIDATION', 'driveId and slotId must be whole numbers.');
    }
    const donor = await donorService.getDonorByUserId(req.user.id);
    if (!donor) return fail(res, 403, 'NO_PROFILE', 'Create your donor profile first.');

    const drive = await driveService.getDrive(driveId);
    if (!drive) return fail(res, 404, 'NOT_FOUND', 'Drive not found.');
    if (drive.status !== 'open') return fail(res, 409, 'DRIVE_CLOSED', 'This drive is not open for booking.');
    if (drive.driveDate < today()) return fail(res, 409, 'DRIVE_PAST', 'This drive already took place.');

    const elig = await donorService.getEligibility(donor.id);
    if (!elig.eligible && (!elig.nextEligibleDate || elig.nextEligibleDate > drive.driveDate)) {
      return fail(res, 409, 'NOT_ELIGIBLE', elig.nextEligibleDate
        ? 'You can donate again from ' + elig.nextEligibleDate + '.'
        : 'You are not eligible to donate.');
    }

    const result = await bookingService.createBooking(donor.id, driveId, slotId);
    if (!result.ok) {
      const [status, code, message] = reasonToError[result.reason] || [500, 'SERVER_ERROR', 'Could not book.'];
      return fail(res, status, code, message);
    }

    try {
      const slots = await driveService.listSlots(driveId);
      const slot = slots.find((s) => s.id === slotId) || {};
      await queue.sendJob({ type: 'booking', bookingId: result.booking.id, email: req.user.email,
        title: drive.title, venue: drive.venue, driveDate: drive.driveDate, startTime: slot.startTime });
    } catch (err) {
      console.error('could not queue the email:', err.message);
    }
    return res.status(201).json({ data: result.booking });
  } catch (err) { next(err); }
};

// GET /api/bookings/me
exports.mine = async (req, res, next) => {
  try {
    const donor = await donorService.getDonorByUserId(req.user.id);
    if (!donor) return res.json({ data: [] });
    res.json({ data: await bookingService.listByDonor(donor.id) });
  } catch (err) { next(err); }
};

// PATCH /api/bookings/:id/cancel
exports.cancel = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!isId(id)) return fail(res, 400, 'VALIDATION', 'The booking id must be a whole number.');
    const booking = await bookingService.getBooking(id);
    if (!booking) return fail(res, 404, 'NOT_FOUND', 'Booking not found.');
    const donor = await donorService.getDonorByUserId(req.user.id);
    if (!donor || donor.id !== booking.donorId) return fail(res, 403, 'FORBIDDEN', 'This is not your booking.');
    if (booking.status !== 'booked') return fail(res, 409, 'NOT_CANCELLABLE', 'Only an active booking can be cancelled.');
    const drive = await driveService.getDrive(booking.driveId);
    if (drive.driveDate <= today()) return fail(res, 409, 'TOO_LATE', 'You can cancel only until the day before the drive.');
    const cancelled = await bookingService.cancelBooking(id);
    if (cancelled) await driveService.releaseSeat(booking.slotId);
    res.json({ data: cancelled });
  } catch (err) { next(err); }
};

// PATCH /api/bookings/:id/check-in   body: { status: 'attended' or 'no_show' }
exports.checkIn = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!isId(id)) return fail(res, 400, 'VALIDATION', 'The booking id must be a whole number.');
    if (status !== 'attended' && status !== 'no_show') {
      return fail(res, 400, 'VALIDATION', "status must be 'attended' or 'no_show'.");
    }
    const booking = await bookingService.getBooking(id);
    if (!booking) return fail(res, 404, 'NOT_FOUND', 'Booking not found.');
    const drive = await driveService.getDrive(booking.driveId);
    if (drive.organizerId !== req.user.id) return fail(res, 403, 'FORBIDDEN', 'This is not your drive.');
    if (booking.status !== 'booked') return fail(res, 409, 'ALREADY_CHECKED_IN', 'This booking is already closed.');
    const updated = await bookingService.checkIn(id, status);
    if (status === 'attended') {
      await donorService.recordDonation({ donorId: booking.donorId, driveId: booking.driveId, bookingId: id });
    }
    res.json({ data: updated });
  } catch (err) { next(err); }
};

// GET /api/bookings/drive/:driveId   (organizer of that drive)
exports.byDrive = async (req, res, next) => {
  try {
    const driveId = Number(req.params.driveId);
    if (!isId(driveId)) return fail(res, 400, 'VALIDATION', 'The drive id must be a whole number.');
    const drive = await driveService.getDrive(driveId);
    if (!drive) return fail(res, 404, 'NOT_FOUND', 'Drive not found.');
    if (drive.organizerId !== req.user.id) return fail(res, 403, 'FORBIDDEN', 'This is not your drive.');
    res.json({ data: await bookingService.listByDrive(driveId) });
  } catch (err) { next(err); }
};

// GET /api/bookings/drive/:driveId/export   (organizer only)
exports.exportCsv = async (req, res, next) => {
  try {
    const driveId = Number(req.params.driveId);
    if (!Number.isInteger(driveId)) return res.status(400).json({ error: { code: 'VALIDATION', message: 'The drive id must be a number.' } });
    const result = await reportService.exportDriveReport(driveId);
    res.json({ data: result });
  } catch (err) { next(err); }
};