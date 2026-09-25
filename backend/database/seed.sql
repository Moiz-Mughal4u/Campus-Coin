USE campus_coin;

-- Default admin account (password: Admin@123 -- change after first login)
-- Password hash generated with bcrypt for 'Admin@123'
INSERT INTO users (name, email, password_hash, role) VALUES
('System Admin', 'admin@campuscoin.app', '$2a$10$.opkmDpMjzv4jCA22MKZO.ZPtPdlnIivNoM9L1TQvPQi39oLDdiFy', 'admin');

-- Default global categories (available to every student)
INSERT INTO categories (user_id, name, type, is_default) VALUES
(NULL, 'Allowance', 'income', TRUE),
(NULL, 'Part-time Job', 'income', TRUE),
(NULL, 'Scholarship', 'income', TRUE),
(NULL, 'Gift', 'income', TRUE),
(NULL, 'Other Income', 'income', TRUE),
(NULL, 'Food', 'expense', TRUE),
(NULL, 'Transport', 'expense', TRUE),
(NULL, 'Hostel/Rent', 'expense', TRUE),
(NULL, 'Academics', 'expense', TRUE),
(NULL, 'Subscriptions', 'expense', TRUE),
(NULL, 'Entertainment', 'expense', TRUE),
(NULL, 'Miscellaneous', 'expense', TRUE);

INSERT INTO announcements (title, message) VALUES
('Welcome to Campus Coin', 'Track your allowance, part-time income and daily spending in one place.');
