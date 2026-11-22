const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9af]{12}$/i;
function isUuid(value) {
return typeof value === 'string' && UUID_PATTERN.test(value);
}
// Is there already a booking (not cancelled) for this donor in this drive?
async function findActiveBooking(donorId, driveId) {
const rows = await sql`
SELECT id FROM bookings
WHERE donor_id = ${donorId} AND drive_id = ${driveId} AND status <>
'cancelled'
LIMIT 1`;
return rows[0] || null;
}
async function createBooking(donorId, driveId, slotId) {
const rows = await sql`
INSERT INTO bookings (donor_id, drive_id, slot_id)
VALUES (${donorId}, ${driveId}, ${slotId})
RETURNING id, donor_id AS "donorId", drive_id AS "driveId", slot_id AS
"slotId",
status, created_at AS "createdAt"`;
return rows[0];
}
async function getBooking(id) {
if (!isUuid(id)) return null;
const rows = await sql`
SELECT id, donor_id AS "donorId", drive_id AS "driveId", slot_id AS
"slotId", status
FROM bookings WHERE id = ${id}`;
return rows[0] || null;
}
async function listMyBookings(donorId) {
return sql`
SELECT b.id, b.status,
d.id AS "driveId", d.title AS "driveTitle", d.venue,
to_char(d.drive_date, 'YYYY-MM-DD') AS "driveDate",
s.id AS "slotId", LEFT(s.start_time::text, 5) AS "startTime",
LEFT(s.end_time::text, 5) AS "endTime"
FROM bookings b
JOIN drives d ON d.id = b.drive_id
JOIN time_slots s ON s.id = b.slot_id
WHERE b.donor_id = ${donorId}
ORDER BY d.drive_date DESC, s.start_time`;
}
async function listDriveBookings(driveId) {
return sql`
SELECT b.id, b.status, b.donor_id AS "donorId",
dn.full_name AS "donorName", dn.blood_type AS "bloodType", u.email
AS "donorEmail",
LEFT(s.start_time::text, 5) AS "startTime", LEFT(s.end_time::text,
5) AS "endTime"
FROM bookings b
JOIN donors dn ON dn.id = b.donor_id
JOIN users u ON u.id = b.donor_id
JOIN time_slots s ON s.id = b.slot_id
WHERE b.drive_id = ${driveId}
ORDER BY s.start_time, dn.full_name`;
}
// Only a booking that is still 'booked' can be cancelled. Returns the slot to give back.
async function cancelBooking(id) {
const rows = await sql`
UPDATE bookings SET status = 'cancelled'
WHERE id = ${id} AND status = 'booked'
RETURNING slot_id AS "slotId"`;
return rows[0] || null;
}

// outcome is 'attended' or 'no_show'. Only a 'booked' booking can be checked in.
async function checkIn(id, outcome) {
const rows = await sql`
UPDATE bookings SET status = ${outcome}, checked_in_at = now()
WHERE id = ${id} AND status = 'booked'
RETURNING id, donor_id AS "donorId", drive_id AS "driveId", status,
checked_in_at AS "checkedInAt"`;
return rows[0] || null;
}
// Used by Student 1's turnout report.
async function getDriveCounts(driveId) {
const rows = await sql`
SELECT count(*) FILTER (WHERE status = 'booked') AS booked,
count(*) FILTER (WHERE status = 'attended') AS attended,
count(*) FILTER (WHERE status = 'no_show') AS "noShow",
count(*) FILTER (WHERE status = 'cancelled') AS cancelled
FROM bookings WHERE drive_id = ${driveId}`;
const row = rows[0];
return {
booked: Number(row.booked),
attended: Number(row.attended),
noShow: Number(row.noShow),
cancelled: Number(row.cancelled)
};
}
// ---- reminders ----
// One reminder, due at 09:00 Cairo time on the day before the drive.
async function createReminder(bookingId) {
await sql`
INSERT INTO reminders (booking_id, send_at)
SELECT b.id, ((d.drive_date - 1) + TIME '09:00') AT TIME ZONE
'Africa/Cairo'
FROM bookings b JOIN drives d ON d.id = b.drive_id
WHERE b.id = ${bookingId}`;
}
async function getEmailInfo(bookingId) {
const rows = await sql`
SELECT u.email AS "to", d.title, d.venue,

to_char(d.drive_date, 'YYYY-MM-DD') AS "driveDate",
LEFT(s.start_time::text, 5) AS "startTime"
FROM bookings b
JOIN drives d ON d.id = b.drive_id
JOIN time_slots s ON s.id = b.slot_id
JOIN users u ON u.id = b.donor_id
WHERE b.id = ${bookingId}`;
return rows[0] || null;
}
// Pending reminders whose time has come, for bookings that are still active.
async function findDueReminders() {
return sql`
SELECT r.id AS "reminderId", u.email AS "to", d.title, d.venue,
to_char(d.drive_date, 'YYYY-MM-DD') AS "driveDate",
LEFT(s.start_time::text, 5) AS "startTime"
FROM reminders r
JOIN bookings b ON b.id = r.booking_id
JOIN drives d ON d.id = b.drive_id
JOIN time_slots s ON s.id = b.slot_id
JOIN users u ON u.id = b.donor_id
WHERE r.status = 'pending' AND r.send_at <= now()
AND b.status = 'booked' AND d.drive_date >= CURRENT_DATE
ORDER BY r.send_at
LIMIT 20`;
}
async function markReminderSent(id) {
await sql`UPDATE reminders SET status = 'sent', sent_at = now() WHERE id =
${id}`;
}
async function markReminderFailed(id) {
await sql`UPDATE reminders SET status = 'failed' WHERE id = ${id}`;
}
module.exports = {
isUuid, findActiveBooking, createBooking, getBooking, listMyBookings,
listDriveBookings, cancelBooking, checkIn, getDriveCounts,
createReminder, getEmailInfo, findDueReminders, markReminderSent,
markReminderFailed
};
