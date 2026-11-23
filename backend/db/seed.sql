lINSERT INTO users (email, password_hash, role) VALUES
('organizer@test.local', 'not-a-real-hash', 'organizer'),
('donor1@test.local', 'not-a-real-hash', 'donor'),
('donor2@test.local', 'not-a-real-hash', 'donor'),
('donor3@test.local', 'not-a-real-hash', 'donor');
INSERT INTO donors (user_id, full_name, blood_type, date_of_birth,
last_donation_date) VALUES
(2, 'Test Donor One', 'O+', '2000-01-15', NULL),
(3, 'Test Donor Two (not eligible)', 'A-', '1999-05-20', CURRENT_DATE -
10),
(4, 'Test Donor Three', 'B+', '2001-09-02', NULL);
INSERT INTO drives (organizer_id, title, venue, city, drive_date) VALUES
(1, 'Campus Blood Drive', 'Main Hall', 'Cairo', CURRENT_DATE + 7);
INSERT INTO time_slots (drive_id, start_time, end_time, capacity) VALUES
(1, '09:00', '10:00', 1),
(1, '10:00', '11:00', 5);
