router.get('/drive/:driveId/export', requireAuth, requireRole('organizer'),
bookings.exportCsv);
const router = require('express').Router();
const controller = require('../controllers/bookings');
const { requireAuth, requireRole } = require('../middleware/auth');
router.post('/', requireAuth, requireRole('donor'), controller.create);
router.get('/me', requireAuth, requireRole('donor'), controller.mine);
router.patch('/:id/cancel', requireAuth, requireRole('donor'),
controller.cancel);
router.patch('/:id/check-in', requireAuth, requireRole('organizer'),
controller.checkIn);
router.get('/drive/:driveId', requireAuth, requireRole('organizer'),
controller.byDrive);
module.exports = router;

