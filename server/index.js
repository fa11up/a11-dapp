import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get user by wallet address
app.get('/api/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await pool.query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [address.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user exists by email
app.get('/api/user/check/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(
      'SELECT wallet_address FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    res.json({ 
      exists: result.rows.length > 0,
      walletAddress: result.rows.length > 0 ? result.rows[0].wallet_address : null
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (Sign Up)
app.post('/api/user/signup', async (req, res) => {
  try {
    const { walletAddress, email, displayName, authMethod, profileImage } = req.body;
    
    // Validate required fields
    if (!walletAddress || !authMethod) {
      return res.status(400).json({ error: 'Wallet address and auth method are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE wallet_address = $1 OR (email = $2 AND email IS NOT NULL)',
      [walletAddress.toLowerCase(), email?.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: 'User already exists',
        user: existingUser.rows[0]
      });
    }

    // Create new user
    const result = await pool.query(
      `INSERT INTO users (wallet_address, email, display_name, auth_method, profile_image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [walletAddress.toLowerCase(), email?.toLowerCase(), displayName || 'Web3 User', authMethod, profileImage]
    );
    
    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update user (Sign In - existing logic)
app.post('/api/user', async (req, res) => {
  try {
    const { walletAddress, email, displayName, authMethod, profileImage } = req.body;
    
    const result = await pool.query(
      `INSERT INTO users (wallet_address, email, display_name, auth_method, profile_image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (wallet_address) 
       DO UPDATE SET 
         email = COALESCE($2, users.email),
         display_name = COALESCE($3, users.display_name),
         auth_method = COALESCE($4, users.auth_method),
         profile_image = COALESCE($5, users.profile_image),
         updated_at = NOW()
       RETURNING *`,
      [walletAddress.toLowerCase(), email?.toLowerCase(), displayName, authMethod, profileImage]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user display name
app.patch('/api/user/:address/name', async (req, res) => {
  try {
    const { address } = req.params;
    const { displayName } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET display_name = $1, updated_at = NOW()
       WHERE wallet_address = $2
       RETURNING *`,
      [displayName, address.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user name:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.patch('/api/user/:address/profile', async (req, res) => {
  try {
    const { address } = req.params;
    const { email, displayName, profileImage } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (email !== undefined) {
      updates.push(`email = ${paramCount++}`);
      values.push(email.toLowerCase());
    }
    if (displayName !== undefined) {
      updates.push(`display_name = ${paramCount++}`);
      values.push(displayName);
    }
    if (profileImage !== undefined) {
      updates.push(`profile_image = ${paramCount++}`);
      values.push(profileImage);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(address.toLowerCase());

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE wallet_address = ${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for admin purposes)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT wallet_address, email, display_name, auth_method, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (for testing/admin)
app.delete('/api/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await pool.query(
      'DELETE FROM users WHERE wallet_address = $1 RETURNING *',
      [address.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});