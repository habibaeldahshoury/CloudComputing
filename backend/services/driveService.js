// backend/services/driveService.js (TEMPORARY STUB, never commit)
async function getDrive() { return { id: 'x', organizerId: '00000000-0000-0000-0000-0000000000a1', status: 'open' }; 
}
async function reserveSeat() { return { ok: true }; }
async function releaseSeat() {}
module.exports = { getDrive, reserveSeat, releaseSeat };