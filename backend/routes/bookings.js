const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const controller = require('../controllers/bookings');

const router = express.Router();

router.post('/', requireAuth, requireRole('donor'), controller.create);
router.get('/me', requireAuth, requireRole('donor'), controller.mine);
router.patch('/:id/cancel', requireAuth, requireRole('donor'),
controller.cancel);
router.patch('/:id/check-in', requireAuth, requireRole('organizer'),
controller.checkIn);
router.get('/drive/:driveId', requireAuth, requireRole('organizer'),
controller.byDrive);
router.get('/drive/:driveId/export', requireAuth, requireRole('organizer'),
controller.exportCsv);
module.exports = router;
