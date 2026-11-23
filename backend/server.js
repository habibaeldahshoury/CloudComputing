const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/bookings');
const reminderRoutes = require('./routes/reminders');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/bookings', bookingRoutes);
app.use('/api/reminders', reminderRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: err.message || 'Internal server error'
    }
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

module.exports = app;