-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(100),
  auth_method VARCHAR(50) NOT NULL, -- 'wallet', 'email', 'google', 'apple', 'facebook'
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallet_address ON users(wallet_address);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_email ON users(email);