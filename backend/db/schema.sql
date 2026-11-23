CREATE TABLE users (
id SERIAL PRIMARY KEY,
email VARCHAR(255) NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
role TEXT NOT NULL CHECK (role IN ('donor', 'organizer')),
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE donors (
id SERIAL PRIMARY KEY,
user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE
CASCADE,
full_name VARCHAR(100) NOT NULL,
phone VARCHAR(30),
blood_type TEXT NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-
','AB+','AB-','O+','O-')),
date_of_birth DATE NOT NULL,
last_donation_date DATE
);
CREATE TABLE drives (
id SERIAL PRIMARY KEY,
organizer_id INT NOT NULL REFERENCES users(id),
title VARCHAR(100) NOT NULL,
venue VARCHAR(200) NOT NULL,
city VARCHAR(80) NOT NULL,
drive_date DATE NOT NULL,
status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open',
'cancelled')),
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE time_slots (
id SERIAL PRIMARY KEY,
drive_id INT NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
start_time TIME NOT NULL,
end_time TIME NOT NULL,
capacity INT NOT NULL CHECK (capacity > 0),
booked_count INT NOT NULL DEFAULT 0,
CHECK (end_time > start_time),
CHECK (booked_count >= 0 AND booked_count <= capacity)
);
CREATE TABLE bookings (
id SERIAL PRIMARY KEY,
donor_id INT NOT NULL REFERENCES donors(id),
drive_id INT NOT NULL REFERENCES drives(id),
slot_id INT NOT NULL REFERENCES time_slots(id),
status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked',
'cancelled', 'attended', 'no_show')),
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
checked_in_at TIMESTAMPTZ
);
-- a donor can hold only one active booking per drive
CREATE UNIQUE INDEX one_active_booking_per_drive
ON bookings (donor_id, drive_id) WHERE status <> 'cancelled';
CREATE TABLE donations (
id SERIAL PRIMARY KEY,
donor_id INT NOT NULL REFERENCES donors(id),
drive_id INT NOT NULL REFERENCES drives(id),
booking_id INT UNIQUE REFERENCES bookings(id),
donation_date DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE TABLE reminders (
id SERIAL PRIMARY KEY,
booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending',
'sent', 'failed')),
sent_at TIMESTAMPTZ
);
