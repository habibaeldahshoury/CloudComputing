const bookingRoutes = require('./routes/bookings');
const reminderRoutes = require('./routes/reminders');
app.use('/api/bookings', bookingRoutes);
app.use('/api/reminders', reminderRoutes);