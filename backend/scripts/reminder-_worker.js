require('dotenv').config();
const queue = require('../services/queueService');
const email = require('../services/emailService');
const bookingService = require('../services/bookingService');
async function loop() {
try {
const messages = await queue.receiveJobs();
for (const m of messages) {
const job = JSON.parse(m.Body);
try {
if (job.type === 'reminder') {
await email.sendEmail(job.email, 'Reminder: blood donation tomorrow', email.reminderText(job));
await bookingService.markReminder(job.bookingId, 'sent');
} else {
await email.sendEmail(job.email, 'Your blood donation booking',
email.bookingText(job));
}
await queue.deleteJob(m);
console.log('sent', job.type, 'email for booking', job.bookingId);
} catch (err) {
console.error('could not send, will retry:', err.message);
if (job.type === 'reminder') await
bookingService.markReminder(job.bookingId, 'failed');
}
}
} catch (err) {
console.error('queue error:', err.message);
await new Promise((r) => setTimeout(r, 5000));
}
setImmediate(loop);
}
console.log('Worker started. Press Ctrl+C to stop.');
loop();