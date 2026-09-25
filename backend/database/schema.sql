-- Campus Coin Database Schema (MySQL 8+)
CREATE DATABASE IF NOT EXISTS campus_coin CHARACTER SET utf8mb4;
USE campus_coin;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  academic_year VARCHAR(40) DEFAULT NULL,
  monthly_allowance_baseline DECIMAL(10,2) DEFAULT 0,
  monthly_savings_goal DECIMAL(10,2) DEFAULT 0,
  is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  reset_token VARCHAR(255) DEFAULT NULL,
  reset_token_expires DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,               -- NULL = system default/global category
  name VARCHAR(80) NOT NULL,
  type ENUM('income','expense') NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('income','expense') NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  ai_suggested_category_id INT DEFAULT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE budgets (
  budget_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  month CHAR(7) NOT NULL,                  -- format YYYY-MM
  limit_amount DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id),
  UNIQUE KEY uniq_budget (user_id, category_id, month)
);

CREATE TABLE insights (
  insight_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  month CHAR(7) NOT NULL,
  summary_text TEXT,
  tip_text TEXT,
  is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE saved_tips (
  tip_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tip_text VARCHAR(255) NOT NULL,
  category_id INT DEFAULT NULL,
  potential_savings DECIMAL(10,2) DEFAULT 0,
  status ENUM('active','pinned','dismissed') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE announcements (
  announcement_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
