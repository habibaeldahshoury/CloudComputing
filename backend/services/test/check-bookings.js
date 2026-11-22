require('dotenv').config();
require('../bookingService')
  .listDriveBookings('00000000-0000-0000-0000-0000000000d1')
  .then(console.log)
  .catch(console.error);