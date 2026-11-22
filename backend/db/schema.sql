CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
email VARCHAR(255) NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
role TEXT NOT NULL CHECK (role IN ('donor', 'organizer')),
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE donors (
id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
full_name VARCHAR(100) NOT NULL,
phone VARCHAR(30),
blood_type TEXT NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
date_of_birth DATE NOT NULL,
last_donation_date DATE
);
CREATE TABLE bookings (
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE drives (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
title VARCHAR(200) NOT NULL,
venue VARCHAR(200),
city VARCHAR(100)
);
CREATE TABLE donations (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
donor_id UUID NOT NULL REFERENCES donors(id),
drive_id UUID NOT NULL REFERENCES drives(id),
booking_id UUID UNIQUE REFERENCES bookings(id),
donation_date DATE NOT NULL DEFAULT CURRENT_DATE
);
