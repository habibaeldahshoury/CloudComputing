const sql = require('../db/sql');
const driveService = require('./driveService');
  
const toBooking = (r) => ({
id: r.id, donorId: r.donor_id, driveId: r.drive_id, slotId: r.slot_id,
status: r.status, createdAt: r.created_at, checkedInAt: r.checked_in_at
});
// take a seat first (atomic, Student 1), then save the booking
async function createBooking(donorId, driveId, slotId) {
const seat = await driveService.reserveSeat(driveId, slotId);
if (!seat.ok) return seat;
try {
const rows = await sql`INSERT INTO bookings (donor_id, drive_id, slot_id)
VALUES (${donorId}, ${driveId}, ${slotId}) RETURNING *`;
return { ok: true, booking: toBooking(rows[0]) };
} catch (err) {
await driveService.releaseSeat(slotId); // undo the seat
if (err.code === '23505') return { ok: false, reason: 'ALREADY_BOOKED' };
throw err;
}
}
async function getBooking(id) {
const rows = await sql`SELECT * FROM bookings WHERE id = ${id}`;
return rows[0] ? toBooking(rows[0]) : null;
}
async function listByDonor(donorId) {
const rows = await sql`SELECT b.id, b.status, d.title, d.venue, d.city,
d.drive_date::text AS drive_date, s.start_time::text AS start_time,
s.end_time::text AS end_time
FROM bookings b
JOIN drives d ON d.id = b.drive_id
JOIN time_slots s ON s.id = b.slot_id
WHERE b.donor_id = ${donorId}
ORDER BY d.drive_date DESC, s.start_time`;
return rows.map((r) => ({
id: r.id, status: r.status, title: r.title, venue: r.venue, city: r.city,
driveDate: String(r.drive_date).slice(0, 10),
startTime: String(r.start_time).slice(0, 5), endTime:
String(r.end_time).slice(0, 5)
}));
}
async function listByDrive(driveId) {
const rows = await sql`SELECT b.id, b.status, dn.full_name, dn.blood_type,
u.email, s.start_time::text AS start_time, s.end_time::text AS end_time
FROM bookings b
JOIN donors dn ON dn.id = b.donor_id
JOIN users u ON u.id = dn.user_id
JOIN time_slots s ON s.id = b.slot_id
WHERE b.drive_id = ${driveId} AND b.status <> 'cancelled'
ORDER BY s.start_time`;
return rows.map((r) => ({
id: r.id, status: r.status, fullName: r.full_name, bloodType:
r.blood_type, email: r.email,
startTime: String(r.start_time).slice(0, 5), endTime:
String(r.end_time).slice(0, 5)
}));
}
// only a booking that is still 'booked' can be cancelled or checked in
async function cancelBooking(id) {
const rows = await sql`UPDATE bookings SET status = 'cancelled'
WHERE id = ${id} AND status = 'booked' RETURNING *`;
return rows[0] ? toBooking(rows[0]) : null;
}
async function checkIn(id, status) {
const rows = await sql`UPDATE bookings SET status = ${status},
checked_in_at = now()
WHERE id = ${id} AND status = 'booked' RETURNING *`;
return rows[0] ? toBooking(rows[0]) : null;
}
async function getDriveCounts(driveId) {
const rows = await sql`SELECT status, count(*)::int AS n FROM bookings
WHERE drive_id = ${driveId} GROUP BY status`;
const counts = { booked: 0, attended: 0, noShow: 0, cancelled: 0 };
for (const r of rows) {
if (r.status === 'no_show') counts.noShow = r.n;
else counts[r.status] = r.n;
}
return counts;
}
// bookings whose drive is tomorrow and that have no reminder yet
async function findDueReminders() {
const rows = await sql`SELECT b.id AS booking_id, u.email, d.title,
d.venue, d.drive_date::text AS drive_date, s.start_time::text AS start_time
FROM bookings b
JOIN donors dn ON dn.id = b.donor_id
JOIN users u ON u.id = dn.user_id
JOIN drives d ON d.id = b.drive_id
JOIN time_slots s ON s.id = b.slot_id
WHERE b.status = 'booked' AND d.status = 'open'
AND d.drive_date = CURRENT_DATE + 1
AND NOT EXISTS (SELECT 1 FROM reminders r WHERE r.booking_id = b.id)`;
return rows.map((r) => ({
bookingId: r.booking_id, email: r.email, title: r.title, venue: r.venue,
driveDate: String(r.drive_date).slice(0, 10), startTime:
String(r.start_time).slice(0, 5)
}));
}
async function addReminder(bookingId) {
await sql`INSERT INTO reminders (booking_id) VALUES (${bookingId})`;
}
async function markReminder(bookingId, status) {
await sql`UPDATE reminders SET status = ${status},
sent_at = CASE WHEN ${status} = 'sent' THEN now() ELSE NULL END
WHERE booking_id = ${bookingId}`;
}
module.exports = { createBooking, getBooking, listByDonor, listByDrive,
cancelBooking, checkIn,
getDriveCounts, findDueReminders, addReminder, markReminder };