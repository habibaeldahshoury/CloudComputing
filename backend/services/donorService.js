const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
const ELIGIBILITY_DAYS = Number(process.env.ELIGIBILITY_DAYS) || 56;


async function findUserByEmail(email) {
const rows = await sql`
SELECT id, email, password_hash AS "passwordHash", role
FROM users WHERE email = ${email}`;
return rows[0] || null;
}
async function createUser(email, passwordHash, role) {
const rows = await sql`
INSERT INTO users (email, password_hash, role)
VALUES (${email}, ${passwordHash}, ${role})
RETURNING id, email, role`;
return rows[0];
}


async function getDonor(id) {
const rows = await sql`
SELECT id, full_name AS "fullName", phone, blood_type AS "bloodType",
to_char(date_of_birth, 'YYYY-MM-DD') AS "dateOfBirth",
to_char(last_donation_date, 'YYYY-MM-DD') AS "lastDonationDate"
FROM donors WHERE id = ${id}`;
return rows[0] || null;
}
async function createDonor(id, { fullName, phone, bloodType, dateOfBirth }) {
const rows = await sql`
INSERT INTO donors (id, full_name, phone, blood_type, date_of_birth)
VALUES (${id}, ${fullName}, ${phone || null}, ${bloodType},
${dateOfBirth})
RETURNING id, full_name AS "fullName", phone, blood_type AS "bloodType",
to_char(date_of_birth, 'YYYY-MM-DD') AS "dateOfBirth",
to_char(last_donation_date, 'YYYY-MM-DD') AS
"lastDonationDate"`;
return rows[0];
}


async function updateDonor(id, { fullName, phone, bloodType }) {
const rows = await sql`
UPDATE donors SET
full_name = COALESCE(${fullName ?? null}, full_name),
phone = COALESCE(${phone ?? null}, phone),
blood_type = COALESCE(${bloodType ?? null}, blood_type)
WHERE id = ${id}
RETURNING id, full_name AS "fullName", phone, blood_type AS "bloodType",
to_char(date_of_birth, 'YYYY-MM-DD') AS "dateOfBirth",
to_char(last_donation_date, 'YYYY-MM-DD') AS
"lastDonationDate"`;
return rows[0] || null;
}

async function getEligibility(donorId) {
const rows = await sql`
SELECT to_char(last_donation_date + ${ELIGIBILITY_DAYS}::int, 'YYYY-MM-DD') AS "nextEligibleDate",
(last_donation_date IS NULL
OR last_donation_date + ${ELIGIBILITY_DAYS}::int <= CURRENT_DATE)
AS eligible
FROM donors WHERE id = ${donorId}`;
if (!rows[0]) return null;
return {
eligible: rows[0].eligible,
nextEligibleDate: rows[0].eligible ? null : rows[0].nextEligibleDate
};
}



async function recordDonation({ donorId, driveId, bookingId }) {
const [inserted] = await sql.transaction([
sql`INSERT INTO donations (donor_id, drive_id, booking_id)
VALUES (${donorId}, ${driveId}, ${bookingId})
ON CONFLICT (booking_id) DO NOTHING
RETURNING id, donor_id AS "donorId", drive_id AS "driveId",
booking_id AS "bookingId",
to_char(donation_date, 'YYYY-MM-DD') AS "donationDate"`,
sql`UPDATE donors SET last_donation_date = CURRENT_DATE WHERE id =
${donorId}`
]);
return inserted[0] || null;
}
async function listDonations(donorId) {
return sql`
SELECT n.id, to_char(n.donation_date, 'YYYY-MM-DD') AS "donationDate",
d.title AS "driveTitle", d.venue, d.city
FROM donations n JOIN drives d ON d.id = n.drive_id
WHERE n.donor_id = ${donorId}
ORDER BY n.donation_date DESC`;
}
module.exports = {
findUserByEmail, createUser, getDonor, createDonor, updateDonor,
getEligibility, recordDonation, listDonations
};



