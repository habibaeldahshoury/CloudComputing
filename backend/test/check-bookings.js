require('dotenv').config();
require('../services/bookingService')
.listByDrive(1)
.then(console.log)
.catch(console.error);