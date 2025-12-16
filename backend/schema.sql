-- Simplified users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  display_name VARCHAR(100),
  auth_method VARCHAR(50) NOT NULL, -- 'wallet', 'email', 'google', 'coinbase', 'facebook', 'x', 'github', 'twitch', 'discord', 'phone', 'passkey'
  profile_image TEXT,
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallet_address ON users(wallet_address);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_email ON users(email);

-- Create index on phone_number
CREATE INDEX IF NOT EXISTS idx_phone_number ON users(phone_number);

-- Create index on auth_method for analytics
CREATE INDEX IF NOT EXISTS idx_auth_method ON users(auth_method);