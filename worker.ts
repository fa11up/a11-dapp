import { Pool } from 'pg';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

interface Env {
  DATABASE_URL: string;
  __STATIC_CONTENT: any;
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API routes
      if (path.startsWith('/api/')) {
        const pool = getPool(env);

        if (path === '/api/health') {
          return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (path.match(/^\/api\/user\/0x[a-fA-F0-9]{40}$/) && method === 'GET') {
          const address = path.split('/').pop()!.toLowerCase();
          const result = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [address]);
          
          return new Response(
            JSON.stringify(result.rows.length ? result.rows[0] : { error: 'User not found' }),
            { 
              status: result.rows.length ? 200 : 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        if (path === '/api/user/signup' && method === 'POST') {
          const body = await request.json() as any;
          const { walletAddress, email, displayName, authMethod, profileImage } = body;
          
          if (!walletAddress || !authMethod) {
            return new Response(
              JSON.stringify({ error: 'Wallet address and auth method are required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const existingUser = await pool.query(
            'SELECT * FROM users WHERE wallet_address = $1 OR (email = $2 AND email IS NOT NULL)',
            [walletAddress.toLowerCase(), email?.toLowerCase()]
          );

          if (existingUser.rows.length > 0) {
            return new Response(
              JSON.stringify({ error: 'User already exists', user: existingUser.rows[0] }),
              { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const result = await pool.query(
            `INSERT INTO users (wallet_address, email, display_name, auth_method, profile_image, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
            [walletAddress.toLowerCase(), email?.toLowerCase(), displayName || 'Web3 User', authMethod, profileImage]
          );

          return new Response(
            JSON.stringify({ message: 'User created successfully', user: result.rows[0] }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (path.match(/^\/api\/user\/0x[a-fA-F0-9]{40}\/name$/) && method === 'PATCH') {
          const address = path.split('/')[3].toLowerCase();
          const body = await request.json() as any;
          
          const result = await pool.query(
            `UPDATE users SET display_name = $1, updated_at = NOW() WHERE wallet_address = $2 RETURNING *`,
            [body.displayName, address]
          );

          return new Response(
            JSON.stringify(result.rows.length ? result.rows[0] : { error: 'User not found' }),
            { 
              status: result.rows.length ? 200 : 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        if (path === '/api/users' && method === 'GET') {
          const result = await pool.query(
            'SELECT wallet_address, email, display_name, auth_method, created_at FROM users ORDER BY created_at DESC'
          );
          
          return new Response(JSON.stringify(result.rows), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(
          JSON.stringify({ error: 'Not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Serve static files using getAssetFromKV
      try {
        return await getAssetFromKV(
          {
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: {},
          }
        );
      } catch (e) {
        // SPA fallback - serve index.html for 404s
        try {
          const notFoundResponse = await getAssetFromKV(
            {
              request: new Request(`${url.origin}/index.html`, request),
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: {},
            }
          );
          return new Response(notFoundResponse.body, {
            ...notFoundResponse,
            status: 200,
          });
        } catch (e) {
          return new Response('Not found', { status: 404 });
        }
      }

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error', message: String(error) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
};