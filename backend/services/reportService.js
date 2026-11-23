const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const bookingService = require('./bookingService');
const BUCKET = process.env.REPORTS_BUCKET || 'blood-drive-reports';
function toCsv(rows) {
const header = 'full_name,blood_type,email,status,start_time,end_time';
const lines = rows.map((r) =>
[r.fullName, r.bloodType, r.email, r.status, r.startTime,
r.endTime].join(','));
return [header, ...lines].join('\n');
}
// uploads a CSV of a drive's bookings and returns where it was saved
async function exportDriveReport(driveId) {
const rows = await bookingService.listByDrive(driveId);
const csv = toCsv(rows);
const key = `drive-${driveId}/report-${Date.now()}.csv`;
const client = new S3Client({});
await client.send(new PutObjectCommand({
Bucket: BUCKET, Key: key, Body: csv, ContentType: 'text/csv'
}));
return { bucket: BUCKET, key, rowCount: rows.length };
}
module.exports = { exportDriveReport };