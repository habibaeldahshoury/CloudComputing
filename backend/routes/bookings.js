const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth'); 
//Student 2
const controller = require('../controllers/bookings');
const router = express.Router();
router.post('/', requireAuth, requireRole('donor'),
controller.createBooking);
router.get('/me', requireAuth, requireRole('donor'),
controller.listMyBookings);
router.get('/', requireAuth, requireRole('organizer'),
controller.listDriveBookings);
router.delete('/:id', requireAuth, controller.cancelBooking);
router.post('/:id/check-in', requireAuth, requireRole('organizer'),
controller.checkIn);
module.exports = router;
