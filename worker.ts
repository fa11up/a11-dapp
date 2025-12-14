import { Pool } from 'pg';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

interface Env {
  DATABASE_URL: string;
  __STATIC_CONTENT: any;
}

const assetManifest = JSON.parse(manifestJSON);

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

async function handleAsset(request: Request, env: Env) {
  const url = new URL(request.url);
  let path = url.pathname;
  
  // Serve index.html for root and SPA routes
  if (path === '/' || !path.includes('.')) {
    path = '/index.html';
  }
  
  try {
    // @ts-ignore
    return await env.__STATIC_CONTENT.get(path);
  } catch {
    // @ts-ignore
    return await env.__STATIC_CONTENT.get('/index.html');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle API routes
    if (path.startsWith('/api/')) {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }

      const pool = getPool(env);

      try {
        if (path === '/api/health') {
          return new Response(JSON.stringify({ status: 'ok', message: 'Server is running' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (path.match(/^\/api\/user\/0x[a-fA-F0-9]{40}$/) && method === 'GET') {
          const address = path.split('/').pop()!.toLowerCase();
          const result = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [address]);
          
          if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify(result.rows[0]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (path === '/api/user/signup' && method === 'POST') {
          const { walletAddress, email, displayName, authMethod, profileImage } = await request.json();
          
          if (!walletAddress || !authMethod) {
            return new Response(JSON.stringify({ error: 'Wallet address and auth method are required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const existingUser = await pool.query(
            'SELECT * FROM users WHERE wallet_address = $1 OR (email = $2 AND email IS NOT NULL)',
            [walletAddress.toLowerCase(), email?.toLowerCase()]
          );

          if (existingUser.rows.length > 0) {
            return new Response(JSON.stringify({ error: 'User already exists', user: existingUser.rows[0] }), {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const result = await pool.query(
            `INSERT INTO users (wallet_address, email, display_name, auth_method, profile_image, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
            [walletAddress.toLowerCase(), email?.toLowerCase(), displayName || 'Web3 User', authMethod, profileImage]
          );

          return new Response(JSON.stringify({ message: 'User created successfully', user: result.rows[0] }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (path.match(/^\/api\/user\/0x[a-fA-F0-9]{40}\/name$/) && method === 'PATCH') {
          const address = path.split('/')[3].toLowerCase();
          const { displayName } = await request.json();
          
          const result = await pool.query(
            `UPDATE users SET display_name = $1, updated_at = NOW() WHERE wallet_address = $2 RETURNING *`,
            [displayName, address]
          );

          if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          return new Response(JSON.stringify(result.rows[0]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (path === '/api/users' && method === 'GET') {
          const result = await pool.query(
            'SELECT wallet_address, email, display_name, auth_method, created_at FROM users ORDER BY created_at DESC'
          );
          return new Response(JSON.stringify(result.rows), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });

      } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Serve static files for non-API routes
    return handleAsset(request, env);
  }
};