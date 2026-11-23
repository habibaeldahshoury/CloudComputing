async function sendEmail(to, subject, text) {
const res = await fetch('https://api.resend.com/emails', {
method: 'POST',
headers: { Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
'Content-Type': 'application/json' },
body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject,
text })
});
if (!res.ok) throw new Error('Email API answered ' + res.status);
}
function bookingText(job) {
return `Hello,\n\nYour blood donation is booked.\nDrive:
${job.title}\nPlace: ${job.venue}\nDate: ${job.driveDate}\nTime:
${job.startTime}\n\nThank you!`;
}
function reminderText(job) {
return `Reminder: your blood donation is TOMORROW.\nDrive:
${job.title}\nPlace: ${job.venue}\nTime: ${job.startTime}\n\nPlease eat well
and drink water.`;
}
module.exports = { sendEmail, bookingText, reminderText };