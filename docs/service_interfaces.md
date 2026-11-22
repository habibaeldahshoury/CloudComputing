Owner File and function Returns Used by you
for
Student
2
middleware/auth.js : requireAuth Reads
Authorization:
Bearer <token> ,
checks it with
JWT_SECRET , sets
req.user = { id,
role } ; answers 401
UNAUTHORIZED
otherwise
Knowing
who is calling
Student
2
middleware/auth.js :
requireRole('donor') , also
requireRole('donor','organizer')
Passes the right role,
answers 403
FORBIDDEN otherwise
Role checks
Student
2
services/donorService.js :
getEligibility(donorId)
null if no donor
profile, else {
eligible,
nextEligibleDate }
where the date is
YYYY-MM-DD or null
Refusing
ineligible
donors
Student
2
services/donorService.js :
recordDonation({ donorId,
driveId, bookingId })
Saves a donation
dated today and
updates the donor's
last donation date
Check-in as
attended
Student
1
services/driveService.js :
getDrive(driveId)
{ id, organizerId,
title, venue,
driveDate, status
} or null
Checking
the organizer
owns the
drive
Student
1
services/driveService.js :
reserveSeat(driveId, slotId)
{ ok: true } or {
ok: false, reason
} with reason
NOT_FOUND , FULL or
DRIVE_CLOSED
Taking a seat
atomically
Student
1
services/driveService.js :
releaseSeat(slotId)
Nothing Giving the
seat back on
cancel
Owner File and function Returns Used by you
for
You services/bookingService.js :
getDriveCounts(driveId)
{ booked,
attended, noShow,
cancelled }
Student 1's
turnout
report