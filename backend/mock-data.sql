-- Mock Data for A11 Investment Fund

-- Insert fund information
INSERT INTO funds (
    id, fund_name, total_aum, total_shares_outstanding, current_nav_per_share,
    inception_date, performance_mtd, performance_ytd, performance_inception,
    sharpe_ratio, max_drawdown, volatility, all_time_high_nav, all_time_low_nav
) VALUES (
    1, 'A11 Digital Asset Fund', 12500000.00, 100000.00000000, 125.00000000,
    '2023-01-15', 8.45, 34.67, 125.00,
    1.85, -18.34, 22.45, 145.50000000, 85.00000000
);

-- Insert user share holdings (3 sample users)
INSERT INTO user_shares (wallet_address, fund_id, total_shares, cost_basis, initial_investment_date) VALUES
('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 1, 150.50000000, 12500.00, '2023-03-15'),
('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 1, 500.75000000, 45000.00, '2023-02-01'),
('0xdD870fA1b7C4700F2BD7f44238821C26f7392148', 1, 75.25000000, 8500.00, '2023-06-10');

-- Insert historical fund performance (last 90 days)
INSERT INTO fund_performance (fund_id, date, nav_per_share, total_aum, daily_return) VALUES
(1, '2024-12-24', 125.00, 12500000.00, 0.015),
(1, '2024-12-23', 123.15, 12315000.00, -0.008),
(1, '2024-12-22', 124.14, 12414000.00, 0.022),
(1, '2024-12-21', 121.47, 12147000.00, 0.012),
(1, '2024-12-20', 120.03, 12003000.00, -0.015),
(1, '2024-12-19', 121.85, 12185000.00, 0.018),
(1, '2024-12-18', 119.69, 11969000.00, -0.012),
(1, '2024-12-17', 121.14, 12114000.00, 0.025),
(1, '2024-12-16', 118.18, 11818000.00, 0.008),
(1, '2024-12-15', 117.24, 11724000.00, -0.018),
(1, '2024-12-14', 119.38, 11938000.00, 0.015),
(1, '2024-12-13', 117.61, 11761000.00, 0.012),
(1, '2024-12-12', 116.21, 11621000.00, -0.009),
(1, '2024-12-11', 117.26, 11726000.00, 0.021),
(1, '2024-12-10', 114.84, 11484000.00, -0.014),
(1, '2024-12-09', 116.47, 11647000.00, 0.018),
(1, '2024-12-08', 114.41, 11441000.00, 0.011),
(1, '2024-12-07', 113.16, 11316000.00, -0.022),
(1, '2024-12-06', 115.71, 11571000.00, 0.014),
(1, '2024-12-05', 114.12, 11412000.00, 0.009),
(1, '2024-12-04', 113.10, 11310000.00, -0.016),
(1, '2024-12-03', 114.93, 11493000.00, 0.024),
(1, '2024-12-02', 112.24, 11224000.00, -0.011),
(1, '2024-12-01', 113.47, 11347000.00, 0.017),
(1, '2024-11-30', 111.58, 11158000.00, 0.012),
(1, '2024-11-29', 110.25, 11025000.00, -0.019),
(1, '2024-11-28', 112.38, 11238000.00, 0.025),
(1, '2024-11-27', 109.64, 10964000.00, 0.008),
(1, '2024-11-26', 108.77, 10877000.00, -0.013),
(1, '2024-11-25', 110.21, 11021000.00, 0.016);

-- Insert user transactions
INSERT INTO transactions (
    wallet_address, fund_id, transaction_type, share_quantity, share_price, 
    total_usd_value, transaction_hash, status, created_at, confirmed_at
) VALUES
('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 1, 'MINT', 150.50000000, 100.00000000, 15050.00, 
 '0x8b7d4c7f2e1a3b5c8d9e6f4a2b1c3d5e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c', 'CONFIRMED', 
 '2023-03-15 10:30:00', '2023-03-15 10:35:00'),

('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 1, 'MINT', 500.75000000, 90.00000000, 45067.50,
 '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', 'CONFIRMED',
 '2023-02-01 14:22:00', '2023-02-01 14:28:00'),

('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 1, 'REDEEM', 25.00000000, 120.00000000, 3000.00,
 '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d', 'CONFIRMED',
 '2024-11-15 09:15:00', '2024-11-15 09:22:00'),

('0xdD870fA1b7C4700F2BD7f44238821C26f7392148', 1, 'MINT', 75.25000000, 113.00000000, 8503.25,
 '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f', 'CONFIRMED',
 '2023-06-10 16:45:00', '2023-06-10 16:50:00'),

('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 1, 'MINT', 100.00000000, 118.00000000, 11800.00,
 '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b', 'PENDING',
 '2024-12-24 11:30:00', NULL);

-- Insert fund activities
INSERT INTO fund_activities (fund_id, activity_type, description, amount, asset_symbol, created_at) VALUES
(1, 'TRADE', 'Purchased 2.5 BTC at $42,150', 105375.00, 'BTC', '2024-12-23 14:30:00'),
(1, 'TRADE', 'Sold 15 ETH at $2,280', 34200.00, 'ETH', '2024-12-22 10:15:00'),
(1, 'REBALANCE', 'Quarterly rebalancing: Adjusted BTC allocation from 52% to 50%', NULL, NULL, '2024-12-20 09:00:00'),
(1, 'FEE_COLLECTION', 'Quarterly management fee collected (2% annual)', 62500.00, 'USD', '2024-12-15 00:00:00'),
(1, 'TRADE', 'Purchased 8 ETH at $2,310', 18480.00, 'ETH', '2024-12-18 15:45:00'),
(1, 'DISTRIBUTION', 'Q4 2024 distribution to shareholders', 125000.00, 'USD', '2024-12-10 00:00:00'),
(1, 'TRADE', 'Sold 1.2 BTC at $41,800', 50160.00, 'BTC', '2024-12-08 11:20:00'),
(1, 'REBALANCE', 'Monthly rebalancing: USD position increased to 20%', NULL, NULL, '2024-12-01 09:00:00'),
(1, 'TRADE', 'Purchased 10 ETH at $2,250', 22500.00, 'ETH', '2024-11-28 13:30:00'),
(1, 'FEE_COLLECTION', 'Performance fee collected (20% of profits)', 45000.00, 'USD', '2024-11-15 00:00:00');

-- Insert portfolio assets (current holdings)
INSERT INTO portfolio_assets (
    fund_id, asset_symbol, asset_name, quantity, current_price, cost_basis,
    current_value, weight_percentage, target_weight, unrealized_pnl, 
    unrealized_pnl_percentage, price_change_24h
) VALUES
(1, 'BTC', 'Bitcoin', 148.50000000, 42250.00000000, 38500.00000000,
 6274125.00, 50.19, 50.00, 556725.00, 9.73, 1.85),

(1, 'ETH', 'Ethereum', 1650.25000000, 2285.00000000, 2100.00000000,
 3771821.25, 30.17, 30.00, 305296.25, 8.81, -0.45),

(1, 'USD', 'US Dollar', 2454053.75, 1.00000000, 1.00000000,
 2454053.75, 19.63, 20.00, 0.00, 0.00, 0.00);

-- Insert market data
INSERT INTO market_data (
    asset_symbol, current_price, price_change_24h, price_change_7d,
    volume_24h, market_cap
) VALUES
('BTC', 42250.00000000, 1.85, 5.23, 28500000000.00, 826000000000.00),
('ETH', 2285.00000000, -0.45, 3.67, 15200000000.00, 274000000000.00),
('USD', 1.00000000, 0.00, 0.00, NULL, NULL);

-- Insert performance metrics
INSERT INTO performance_metrics (
    fund_id, date, return_30d, return_60d, return_90d, 
    sharpe_ratio, volatility, max_drawdown
) VALUES
(1, '2024-12-24', 7.85, 12.34, 18.67, 1.85, 22.45, -18.34),
(1, '2024-11-24', 6.42, 10.88, 15.23, 1.72, 24.12, -20.15),
(1, '2024-10-24', 5.23, 9.45, 13.78, 1.68, 25.34, -22.45);