-- Existing users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(20),
  display_name VARCHAR(100),
  auth_method VARCHAR(50) NOT NULL,
  profile_image TEXT,
  last_login_at TIMESTAMP,
  login_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_auth_method ON users(auth_method);

-- Fund metadata and statistics
CREATE TABLE IF NOT EXISTS funds (
    id INTEGER PRIMARY KEY,
    fund_name VARCHAR(100) NOT NULL,
    total_aum REAL NOT NULL,
    total_shares_outstanding REAL NOT NULL,
    current_nav_per_share REAL NOT NULL,
    inception_date TEXT NOT NULL,
    performance_mtd REAL,
    performance_ytd REAL,
    performance_inception REAL,
    sharpe_ratio REAL,
    max_drawdown REAL,
    volatility REAL,
    all_time_high_nav REAL,
    all_time_low_nav REAL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User share holdings
CREATE TABLE IF NOT EXISTS user_shares (
    id INTEGER PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL UNIQUE,
    fund_id INTEGER NOT NULL,
    total_shares REAL NOT NULL DEFAULT 0,
    cost_basis REAL NOT NULL DEFAULT 0,
    initial_investment_date TEXT,
    FOREIGN KEY (fund_id) REFERENCES funds(id)
);

-- Historical fund performance (for charts)
CREATE TABLE IF NOT EXISTS fund_performance (
    id INTEGER PRIMARY KEY,
    fund_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    nav_per_share REAL NOT NULL,
    total_aum REAL NOT NULL,
    daily_return REAL,
    FOREIGN KEY (fund_id) REFERENCES funds(id),
    UNIQUE(fund_id, date)
);

-- User transactions (mints and redemptions)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    fund_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    share_quantity REAL NOT NULL,
    share_price REAL NOT NULL,
    total_usd_value REAL NOT NULL,
    transaction_hash VARCHAR(66),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    FOREIGN KEY (fund_id) REFERENCES funds(id)
);

-- Fund activity feed (manager actions)
CREATE TABLE IF NOT EXISTS fund_activities (
    id INTEGER PRIMARY KEY,
    fund_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount REAL,
    asset_symbol VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fund_id) REFERENCES funds(id)
);

-- Portfolio asset holdings
CREATE TABLE IF NOT EXISTS portfolio_assets (
    id INTEGER PRIMARY KEY,
    fund_id INTEGER NOT NULL,
    asset_symbol VARCHAR(10) NOT NULL,
    asset_name VARCHAR(50) NOT NULL,
    quantity REAL NOT NULL,
    current_price REAL NOT NULL,
    cost_basis REAL NOT NULL,
    current_value REAL NOT NULL,
    weight_percentage REAL NOT NULL,
    target_weight REAL,
    unrealized_pnl REAL,
    unrealized_pnl_percentage REAL,
    price_change_24h REAL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fund_id) REFERENCES funds(id),
    UNIQUE(fund_id, asset_symbol)
);

-- Market data for assets
CREATE TABLE IF NOT EXISTS market_data (
    id INTEGER PRIMARY KEY,
    asset_symbol VARCHAR(10) NOT NULL UNIQUE,
    current_price REAL NOT NULL,
    price_change_24h REAL,
    price_change_7d REAL,
    volume_24h REAL,
    market_cap REAL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fund_performance_date ON fund_performance(fund_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address, created_at);
CREATE INDEX IF NOT EXISTS idx_fund_activities_date ON fund_activities(fund_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_shares_wallet ON user_shares(wallet_address);