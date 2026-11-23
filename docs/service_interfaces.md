Owner File and function Returns You use it to
Student
2
middleware/auth.js :
requireAuth
Reads Authorization:
Bearer <token> , checks
it, sets req.user = {
id, role, email } ,
otherwise answers 401
Know who is
calling
Student
2
middleware/auth.js :
requireRole('donor')
Passes the right role,
otherwise 403
Role checks
Student
2
services/donorService.js :
getDonorByUserId(userId)
{ id, fullName,
bloodType } or null
Find the
donor profile
of a login
Student
2
services/donorService.js :
getEligibility(donorId)
{ eligible,
nextEligibleDate }
(the date is YYYY-MM-DD
or null )
Refuse
ineligible
donors
Student
2
services/donorService.js :
recordDonation({ donorId,
driveId, bookingId })
Saves a donation dated
today and updates the
last donation date
Check-in as
attended
Student
1
services/driveService.js :
getDrive(driveId)
{ id, organizerId,
title, venue, city,
driveDate, status }
or null
Check the
drive and its
owner
Student
1
services/driveService.js :
listSlots(driveId)
Array of { id,
startTime, endTime,
capacity, bookedCount
}
Put the time
in the email
Student
1
services/driveService.js :
reserveSeat(driveId, slotId)
{ ok: true } or { ok:
false, reason } ,
reason is NOT_FOUND ,
FULL or DRIVE_CLOSED
Take a seat,
atomically
Student
1
services/driveService.js :
releaseSeat(slotId)
nothing Give the seat
back on
cancel
You services/bookingService.js :
getDriveCounts(driveId)
{ booked, attended,
noShow, cancelled }
Student 1's
turnout
report