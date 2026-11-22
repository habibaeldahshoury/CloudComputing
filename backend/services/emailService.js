async function sendEmail(to, subject, text) {
if (!process.env.EMAIL_API_KEY) {
throw new Error('EMAIL_API_KEY is not set');
}
const response = await fetch('https://api.resend.com/emails', {
method: 'POST',
headers: {
Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
'Content-Type': 'application/json'
},
body: JSON.stringify({
from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
to: [to],
subject,
text
}),
signal: AbortSignal.timeout(8000) // never hang the serverless function
});
if (!response.ok) {
throw new Error(`Email API returned ${response.status}`);
}
return response.json();
}
function describe(info) {
const when = `${info.driveDate} at ${info.startTime}`;
return `${info.title}\n${info.venue}\nTime: ${when}`;
}
async function sendConfirmationEmail(info) {
return sendEmail(
info.to,
'Your blood donation booking is confirmed',
`Hello ${info.donorName},\n\nYour booking is
confirmed.\n\n${describe(info)}\n\nThank you for donating.`
);
}
async function sendReminderEmail(info) {
return sendEmail(
info.to,
'Reminder: your blood donation is tomorrow',
`Hello ${info.donorName},\n\nA reminder of your
booking.\n\n${describe(info)}`
);
}
module.exports = { sendEmail, sendConfirmationEmail, sendReminderEmail };