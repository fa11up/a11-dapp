/// <reference types="@cloudflare/workers-types" />
import { Pool } from 'pg';

interface Env {
  DATABASE_URL: string;
}

let pool: Pool | null = null;

function getPool(env: Env) {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const db = getPool(env);

  try {
    // Health check
    if (path === '/health' && method === 'GET') {
      return Response.json({ status: 'ok', message: 'Server is running' }, { headers: corsHeaders });
    }

    // GET user by address
    if (path.match(/^\/user\/0x[a-fA-F0-9]{40}$/) && method === 'GET') {
      const address = path.split('/').pop()!.toLowerCase();
      const result = await db.query('SELECT * FROM users WHERE wallet_address = $1', [address]);
      
      if (result.rows.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
      }
      
      return Response.json(result.rows[0], { headers: corsHeaders });
    }

    // POST signup
    if (path === '/user/signup' && method === 'POST') {
      const { walletAddress, email, displayName, authMethod, profileImage } = await request.json();
      
      if (!walletAddress || !authMethod) {
        return Response.json({ error: 'Wallet address and auth method are required' }, { status: 400, headers: corsHeaders });
      }

      const existingUser = await db.query(
        'SELECT * FROM users WHERE wallet_address = $1 OR (email = $2 AND email IS NOT NULL)',
        [walletAddress.toLowerCase(), email?.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return Response.json({ error: 'User already exists', user: existingUser.rows[0] }, { status: 409, headers: corsHeaders });
      }

      const result = await db.query(
        `INSERT INTO users (wallet_address, email, display_name, auth_method, profile_image, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
        [walletAddress.toLowerCase(), email?.toLowerCase(), displayName || 'Web3 User', authMethod, profileImage]
      );

      return Response.json({ message: 'User created successfully', user: result.rows[0] }, { status: 201, headers: corsHeaders });
    }

    // PATCH update name
    if (path.match(/^\/user\/0x[a-fA-F0-9]{40}\/name$/) && method === 'PATCH') {
      const address = path.split('/')[2].toLowerCase();
      const { displayName } = await request.json();
      
      const result = await db.query(
        `UPDATE users SET display_name = $1, updated_at = NOW() WHERE wallet_address = $2 RETURNING *`,
        [displayName, address]
      );

      if (result.rows.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
      }

      return Response.json(result.rows[0], { headers: corsHeaders });
    }

    // PATCH update profile
    if (path.match(/^\/user\/0x[a-fA-F0-9]{40}\/profile$/) && method === 'PATCH') {
      const address = path.split('/')[2].toLowerCase();
      const { email, displayName, profileImage } = await request.json();
      
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (email !== undefined) {
        updates.push(`email = $${paramCount++}`);
        values.push(email.toLowerCase());
      }
      if (displayName !== undefined) {
        updates.push(`display_name = $${paramCount++}`);
        values.push(displayName);
      }
      if (profileImage !== undefined) {
        updates.push(`profile_image = $${paramCount++}`);
        values.push(profileImage);
      }

      if (updates.length === 0) {
        return Response.json({ error: 'No fields to update' }, { status: 400, headers: corsHeaders });
      }

      updates.push(`updated_at = NOW()`);
      values.push(address);

      const result = await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE wallet_address = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
      }

      return Response.json(result.rows[0], { headers: corsHeaders });
    }

    // GET all users
    if (path === '/users' && method === 'GET') {
      const result = await db.query(
        'SELECT wallet_address, email, display_name, auth_method, created_at FROM users ORDER BY created_at DESC'
      );
      return Response.json(result.rows, { headers: corsHeaders });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
};