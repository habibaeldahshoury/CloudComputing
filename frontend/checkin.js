if (sessionStorage.getItem('role') !== 'organizer') location.href =
'login.html';
const message = document.getElementById('message');
const driveSelect = document.getElementById('drive');
const rows = document.getElementById('rows');
function show(text, good) { message.textContent = text; message.className =
good ? 'ok' : 'error'; }
async function loadDrives() {
const r = await api('/api/drives');
if (!r.ok) return show(r.error.message, false);
driveSelect.replaceChildren(...r.data.map((d) => {
const o = document.createElement('option');
o.value = d.id;
o.textContent = d.title + ' - ' + d.driveDate;
return o;
}));
await loadBookings();
}
async function loadBookings() {
rows.replaceChildren();
if (!driveSelect.value) return;
const r = await api('/api/bookings/drive/' + driveSelect.value);
if (!r.ok) return show(r.error.message, false);
for (const b of r.data) {
const tr = document.createElement('tr');
for (const text of [b.fullName, b.bloodType, b.startTime, b.status]) {
const td = document.createElement('td');
td.textContent = text;
tr.appendChild(td);
}
const last = document.createElement('td');
if (b.status === 'booked') {
for (const [label, status] of [['Attended', 'attended'], ['No-show',
'no_show']]) {
const btn = document.createElement('button');
btn.textContent = label;
btn.addEventListener('click', () => checkIn(b.id, status));
last.appendChild(btn);
}
}
tr.appendChild(last);
rows.appendChild(tr);
}
}
async function checkIn(id, status) {
const r = await api('/api/bookings/' + id + '/check-in', { method: 'PATCH',
body: { status } });
show(r.ok ? 'Saved.' : r.error.message, r.ok);
await loadBookings();
}
document.getElementById('reminders').addEventListener('click', async () => {
const r = await api('/api/reminders/send-due', { method: 'POST' });
show(r.ok ? r.data.queued + ' reminder(s) queued.' : r.error.message,
r.ok);
});
driveSelect.addEventListener('change', loadBookings);
loadDrives();