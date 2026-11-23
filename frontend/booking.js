if (!sessionStorage.getItem('token')) location.href = 'login.html';
const message = document.getElementById('message');
const driveSelect = document.getElementById('drive');
const slotSelect = document.getElementById('slot');
const rows = document.getElementById('rows');
function show(text, good) {
message.textContent = text;
message.className = good ? 'ok' : 'error';
}
function option(value, text) {
const o = document.createElement('option');
o.value = value;
o.textContent = text;
return o;
}
async function loadDrives() {
const r = await api('/api/drives');
if (!r.ok) return show(r.error.message, false);
const open = r.data.filter((d) => d.status === 'open');
driveSelect.replaceChildren(...open.map((d) => option(d.id, d.title + ' - '
+ d.city + ' - ' + d.driveDate)));
await loadSlots();
}
async function loadSlots() {
if (!driveSelect.value) return slotSelect.replaceChildren();
const r = await api('/api/drives/' + driveSelect.value + '/slots');
if (!r.ok) return show(r.error.message, false);
slotSelect.replaceChildren(...r.data.map((s) =>
option(s.id, s.startTime + ' - ' + s.endTime + ' (' + (s.capacity -
s.bookedCount) + ' seats left)')));
}
async function loadBookings() {
const r = await api('/api/bookings/me');
if (!r.ok) return show(r.error.message, false);
rows.replaceChildren();
for (const b of r.data) {
const tr = document.createElement('tr');
for (const text of [b.title, b.driveDate, b.startTime + ' - ' +
b.endTime, b.status]) {
const td = document.createElement('td');
td.textContent = text;
tr.appendChild(td);
}
const last = document.createElement('td');
if (b.status === 'booked') {
const btn = document.createElement('button');
btn.textContent = 'Cancel';
btn.addEventListener('click', () => cancelBooking(b.id));
last.appendChild(btn);
}
tr.appendChild(last);
rows.appendChild(tr);
}
}
async function cancelBooking(id) {
const r = await api('/api/bookings/' + id + '/cancel', { method: 'PATCH'
});
show(r.ok ? 'Booking cancelled.' : r.error.message, r.ok);
await loadBookings();
await loadSlots();
}
document.getElementById('book-form').addEventListener('submit', async (e) =>
{
e.preventDefault();
const r = await api('/api/bookings', {
method: 'POST',
body: { driveId: Number(driveSelect.value), slotId:
Number(slotSelect.value) }
});
show(r.ok ? 'Booked! A confirmation email is on its way.' :
r.error.message, r.ok);
await loadBookings();
await loadSlots();
});
driveSelect.addEventListener('change', loadSlots);
loadDrives();
loadBookings();