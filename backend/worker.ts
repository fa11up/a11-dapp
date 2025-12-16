/**
 * Cloudflare Worker for D1 Database API
 * This replaces the Express server for Cloudflare deployment
 */

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
}

// CORS headers helper
function corsHeaders(origin: string | null) {
  const allowedOrigins = ['https://a11.fund', 'https://api.a11.fund', 'http://localhost:5173', 'http://localhost:3000'];
  const requestOrigin = origin || '';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const headers = {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Check if database binding exists
    if (!env.DB) {
      console.error('D1 database binding not found. Check wrangler.toml configuration.');
      return new Response(
        JSON.stringify({ 
          error: 'Database not configured',
          details: 'D1 database binding is missing. Please check wrangler.toml configuration.'
        }),
        { status: 500, headers }
      );
    }

    try {
      // Health check
      if (url.pathname === '/api/health') {
        return new Response(
          JSON.stringify({ status: 'ok', message: 'Server is running' }),
          { headers }
        );
      }

      // Get user by wallet address
      if (url.pathname.match(/^\/api\/user\/0x[a-fA-F0-9]{40}$/) && request.method === 'GET') {
        const address = url.pathname.split('/').pop()?.toLowerCase();
        
        const result = await env.DB.prepare(
          'SELECT * FROM users WHERE wallet_address = ?'
        ).bind(address).first();

        if (!result) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers }
          );
        }

        return new Response(JSON.stringify(result), { headers });
      }

      // Check if user exists by email
      if (url.pathname.match(/^\/api\/user\/check\/email\/.+$/) && request.method === 'GET') {
        const email = url.pathname.split('/').pop()?.toLowerCase();
        
        const result = await env.DB.prepare(
          'SELECT wallet_address FROM users WHERE email = ?'
        ).bind(email).first();

        return new Response(
          JSON.stringify({
            exists: !!result,
            walletAddress: result ? result.wallet_address : null,
          }),
          { headers }
        );
      }

      // Create new user (Sign Up) - supports both /api/signup and /api/user/signup
      if ((url.pathname === '/api/user/signup' || url.pathname === '/api/signup') && request.method === 'POST') {
        const body = await request.json() as any;
        const { 
          walletAddress, 
          email, 
          phoneNumber,
          displayName, 
          authMethod, 
          profileImage,
          googleId,
          appleId,
          facebookId
        } = body;

        if (!walletAddress || !authMethod) {
          return new Response(
            JSON.stringify({ error: 'Wallet address and auth method are required' }),
            { status: 400, headers }
          );
        }

        // Check if user already exists
        const existingUser = await env.DB.prepare(
          'SELECT * FROM users WHERE wallet_address = ?'
        ).bind(walletAddress.toLowerCase()).first();

        if (existingUser) {
          return new Response(
            JSON.stringify({ error: 'User already exists', user: existingUser }),
            { status: 409, headers }
          );
        }

        // Explicitly set undefined values to null for D1
        const emailValue = email !== undefined && email !== '' ? email.toLowerCase() : "";
        const phoneValue = phoneNumber !== undefined && phoneNumber !== '' ? phoneNumber : "";
        const displayNameValue = displayName !== undefined && displayName !== '' ? displayName : 'Web3 User';
        const profileImageValue = profileImage !== undefined && profileImage !== '' ? profileImage : "";
        const googleIdValue = googleId !== undefined && googleId !== '' ? googleId : "";
        const appleIdValue = appleId !== undefined && appleId !== '' ? appleId : "";
        const facebookIdValue = facebookId !== undefined && facebookId !== '' ? facebookId : "";

        console.log('Signup values:', {
          walletAddress: walletAddress.toLowerCase(),
          emailValue,
          phoneValue,
          displayNameValue,
          authMethod,
          profileImageValue,
          googleIdValue,
          appleIdValue,
          facebookIdValue
        });

        // Create new user
        const result = await env.DB.prepare(
          `INSERT INTO users (
            wallet_address, email, phone_number, display_name, auth_method, profile_image,
            google_id, apple_id, facebook_id, last_login_at, login_count, created_at, updated_at
          )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 1, datetime('now'), datetime('now'))
           RETURNING *`
        ).bind(
          walletAddress.toLowerCase(),
          emailValue,
          phoneValue,
          displayNameValue,
          authMethod,
          profileImageValue,
          googleIdValue,
          appleIdValue,
          facebookIdValue
        ).first();

        return new Response(
          JSON.stringify({ message: 'User created successfully', user: result }),
          { status: 201, headers }
        );
      }

      // Update user on login
      if (url.pathname === '/api/user/login' && request.method === 'POST') {
        const body = await request.json() as any;
        const { walletAddress, authMethod, email, phoneNumber, displayName, profileImage } = body;

        if (!walletAddress) {
          return new Response(
            JSON.stringify({ error: 'Wallet address is required' }),
            { status: 400, headers }
          );
        }

        // Build update query dynamically
        const updates = ['last_login_at = datetime(\'now\')', 'login_count = login_count + 1'];
        const values = [];

        if (authMethod) {
          updates.push('auth_method = ?');
          values.push(authMethod);
        }
        if (email !== undefined && email !== '') {
          updates.push('email = ?');
          values.push(email.toLowerCase());
        }
        if (phoneNumber !== undefined && phoneNumber !== '') {
          updates.push('phone_number = ?');
          values.push(phoneNumber);
        }
        if (displayName !== undefined && displayName !== '' && displayName !== 'Web3 User') {
          updates.push('display_name = ?');
          values.push(displayName);
        }
        if (profileImage !== undefined && profileImage !== '') {
          updates.push('profile_image = ?');
          values.push(profileImage);
        }

        updates.push('updated_at = datetime(\'now\')');
        values.push(walletAddress.toLowerCase());

        const result = await env.DB.prepare(
          `UPDATE users SET ${updates.join(', ')} WHERE wallet_address = ? RETURNING *`
        ).bind(...values).first();

        if (!result) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers }
          );
        }

        return new Response(
          JSON.stringify({ message: 'Login tracked successfully', user: result }),
          { headers }
        );
      }

      // Create or update user (Sign In)
      if (url.pathname === '/api/user' && request.method === 'POST') {
        const body = await request.json() as any;
        const { walletAddress, email, displayName, authMethod, profileImage } = body;

        // First try to get existing user
        const existingUser = await env.DB.prepare(
          'SELECT * FROM users WHERE wallet_address = ?'
        ).bind(walletAddress.toLowerCase()).first();

        // Explicitly set undefined values to null for D1
        const emailValue = email !== undefined && email !== '' ? email.toLowerCase() : "";
        const displayNameValue = displayName !== undefined && displayName !== '' ? displayName : "";
        const authMethodValue = authMethod !== undefined && authMethod !== '' ? authMethod : "";
        const profileImageValue = profileImage !== undefined && profileImage !== '' ? profileImage : "";

        let result;
        if (existingUser) {
          // Update existing user - only update non-null values
          result = await env.DB.prepare(
            `UPDATE users SET 
              email = COALESCE(?, email),
              display_name = COALESCE(?, display_name),
              auth_method = COALESCE(?, auth_method),
              profile_image = COALESCE(?, profile_image),
              updated_at = datetime('now')
             WHERE wallet_address = ?
             RETURNING *`
          ).bind(
            emailValue,
            displayNameValue,
            authMethodValue,
            profileImageValue,
            walletAddress.toLowerCase()
          ).first();
        } else {
          // Insert new user
          result = await env.DB.prepare(
            `INSERT INTO users (wallet_address, email, display_name, auth_method, profile_image, last_login_at, login_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'), 1, datetime('now'), datetime('now'))
             RETURNING *`
          ).bind(
            walletAddress.toLowerCase(),
            emailValue,
            displayNameValue || 'Web3 User',
            authMethodValue || 'wallet',
            profileImageValue
          ).first();
        }

        return new Response(JSON.stringify(result), { headers });
      }

      // Update user display name
      if (url.pathname.match(/^\/api\/user\/0x[a-fA-F0-9]{40}\/name$/) && request.method === 'PATCH') {
        const address = url.pathname.split('/')[3].toLowerCase();
        const body = await request.json() as any;
        const { displayName } = body;

        const result = await env.DB.prepare(
          `UPDATE users SET display_name = ?, updated_at = datetime('now')
           WHERE wallet_address = ?
           RETURNING *`
        ).bind(displayName, address).first();

        if (!result) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers }
          );
        }

        return new Response(JSON.stringify(result), { headers });
      }

      // Update user profile
      if (url.pathname.match(/^\/api\/user\/0x[a-fA-F0-9]{40}\/profile$/) && request.method === 'PATCH') {
        const address = url.pathname.split('/')[3].toLowerCase();
        const body = await request.json() as any;
        const { email, displayName, profileImage } = body;

        const updates = [];
        const values = [];

        // Explicitly handle undefined values
        if (email !== undefined) {
          updates.push('email = ?');
          values.push(email !== null && email !== '' ? email.toLowerCase() : "");
        }
        if (displayName !== undefined) {
          updates.push('display_name = ?');
          values.push(displayName !== null && displayName !== '' ? displayName : "");
        }
        if (profileImage !== undefined) {
          updates.push('profile_image = ?');
          values.push(profileImage !== null && profileImage !== '' ? profileImage : "");
        }

        if (updates.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No fields to update' }),
            { status: 400, headers }
          );
        }

        updates.push(`updated_at = datetime('now')`);
        values.push(address);

        const result = await env.DB.prepare(
          `UPDATE users SET ${updates.join(', ')} WHERE wallet_address = ? RETURNING *`
        ).bind(...values).first();

        if (!result) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers }
          );
        }

        return new Response(JSON.stringify(result), { headers });
      }

      // Get all users
      if (url.pathname === '/api/users' && request.method === 'GET') {
        const result = await env.DB.prepare(
          'SELECT wallet_address, email, phone_number, display_name, auth_method, last_login_at, login_count, created_at FROM users ORDER BY created_at DESC'
        ).all();

        return new Response(JSON.stringify(result.results), { headers });
      }

      // Delete user
      if (url.pathname.match(/^\/api\/user\/0x[a-fA-F0-9]{40}$/) && request.method === 'DELETE') {
        const address = url.pathname.split('/').pop()?.toLowerCase();

        const result = await env.DB.prepare(
          'DELETE FROM users WHERE wallet_address = ? RETURNING *'
        ).bind(address).first();

        if (!result) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers }
          );
        }

        return new Response(
          JSON.stringify({ message: 'User deleted successfully', user: result }),
          { headers }
        );
      }

      // Route not found
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404, headers }
      );

    } catch (error: any) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error', 
          details: error?.message || String(error),
          stack: error?.stack
        }),
        { status: 500, headers }
      );
    }
  },
};