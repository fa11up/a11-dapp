-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  display_name VARCHAR(100),
  auth_method VARCHAR(50) NOT NULL, -- 'wallet', 'email', 'google', 'coinbase', 'facebook''x', 'github', 'twitch', 'discord', 'phone', 'passkey'
  profile_image TEXT,
  -- Social login identifiers
  google_id VARCHAR(255),
  coinbase_id VARCHAR(255),
  facebook_id VARCHAR(255),
  x_id VARCHAR(255),
  github_id VARCHAR(255),
  twitch_id VARCHAR(255),
  discord_id VARCHAR(255),
  -- Additional metadata
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

-- Create index on google_id
CREATE INDEX IF NOT EXISTS idx_google_id ON users(google_id);

-- Create index on facebook_id
CREATE INDEX IF NOT EXISTS idx_facebook_id ON users(facebook_id);

-- Create index on coinbase_id
CREATE INDEX IF NOT EXISTS idx_coinbase_id ON users(coinbase_id);

-- Create index on x_id
CREATE INDEX IF NOT EXISTS idx_x_id ON users(x_id);

-- Create index on github_id
CREATE INDEX IF NOT EXISTS idx_github_id ON users(github_id);

-- Create index on twitch_id
CREATE INDEX IF NOT EXISTS idx_twitch_id ON users(twitch_id);

-- Create index on discord_id
CREATE INDEX IF NOT EXISTS idx_discord_id ON users(discord_id);

-- Create index on auth_method for analytics
CREATE INDEX IF NOT EXISTS idx_auth_method ON users(auth_method);