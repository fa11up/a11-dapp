/**
 * Cloudflare Worker for D1 Database API - With Portfolio Management
 */

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
}

interface SignupRequestBody {
  walletAddress: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  authMethod: string;
  profileImage?: string | null;
}

interface LoginRequestBody {
  walletAddress: string;
  authMethod?: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  profileImage?: string;
}

interface UserRequestBody {
  walletAddress: string;
  email?: string;
  displayName?: string;
  authMethod?: string;
  profileImage?: string;
}

interface UpdateNameRequestBody {
  displayName: string;
}

interface UpdateProfileRequestBody {
  email?: string;
  displayName?: string;
  profileImage?: string;
}

interface CorsHeaders {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Methods": string;
  "Access-Control-Allow-Headers": string;
}

function corsHeaders(origin: string | null): CorsHeaders {
  const allowedOrigins = [
    "https://a11.fund",
    "https://api.a11.fund",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  const requestOrigin = origin || "";

  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const headers = {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (!env.DB) {
      console.error(
        "D1 database binding not found. Check wrangler.toml configuration."
      );
      return new Response(
        JSON.stringify({
          error: "Database not configured",
          details:
            "D1 database binding is missing. Please check wrangler.toml configuration.",
        }),
        { status: 500, headers }
      );
    }

    try {
      // Health check
      if (url.pathname === "/api/health") {
        return new Response(
          JSON.stringify({ status: "ok", message: "Server is running" }),
          { headers }
        );
      }

      // ============================================================================
      // PORTFOLIO DASHBOARD ENDPOINTS
      // ============================================================================

      // 1. GET /api/fund/:id - Get fund metadata and statistics
      if (
        url.pathname.match(/^\/api\/fund\/\d+$/) &&
        request.method === "GET"
      ) {
        const fundId = url.pathname.split("/").pop();

        const fund = await env.DB.prepare(
          `
          SELECT 
            id,
            fund_name,
            total_aum,
            total_shares_outstanding,
            current_nav_per_share,
            inception_date,
            performance_mtd,
            performance_ytd,
            performance_inception,
            sharpe_ratio,
            max_drawdown,
            volatility,
            all_time_high_nav,
            all_time_low_nav,
            last_updated
          FROM funds
          WHERE id = ?
        `
        )
          .bind(fundId)
          .first();

        if (!fund) {
          return new Response(JSON.stringify({ error: "Fund not found" }), {
            status: 404,
            headers,
          });
        }

        return new Response(JSON.stringify(fund), { headers });
      }

      // 2. GET /api/user-shares/:wallet - Get user's share holdings
      if (
        url.pathname.match(/^\/api\/user-shares\/0x[a-fA-F0-9]{40}$/) &&
        request.method === "GET"
      ) {
        const wallet = url.pathname.split("/").pop()?.toLowerCase();

        let userShares = await env.DB.prepare(
          `
            SELECT 
              id,
              wallet_address,
              fund_id,
              total_shares,
              cost_basis,
              initial_investment_date
            FROM user_shares
            WHERE wallet_address = ?
          `
        )
          .bind(wallet)
          .first();

        // If user not found, return first user's data as fallback
        if (!userShares) {
          userShares = await env.DB.prepare(
            `
              SELECT 
                id,
                wallet_address,
                fund_id,
                total_shares,
                cost_basis,
                initial_investment_date
              FROM user_shares
              ORDER BY id ASC
              LIMIT 1
            `
          ).first();
        }

        if (!userShares) {
          return new Response(
            JSON.stringify({ error: "No user shares data available" }),
            { status: 404, headers }
          );
        }

        return new Response(JSON.stringify(userShares), { headers });
      }

      // 3. GET /api/fund-performance/:id - Get historical fund performance
      if (
        url.pathname.match(/^\/api\/fund-performance\/\d+$/) &&
        request.method === "GET"
      ) {
        const fundId = url.pathname.split("/").pop();
        const days = url.searchParams.get("days") || "30";

        const performance = await env.DB.prepare(
          `
            SELECT 
              date,
              nav_per_share,
              total_aum,
              daily_return
            FROM fund_performance
            WHERE fund_id = ?
            ORDER BY date DESC
            LIMIT ?
          `
        )
          .bind(fundId, parseInt(days))
          .all();

        // Reverse to get chronological order
        const results = performance.results
          ? performance.results.reverse()
          : [];
        return new Response(JSON.stringify(results), { headers });
      }

      // 4. GET /api/portfolio-assets/:id - Get current portfolio holdings
      if (
        url.pathname.match(/^\/api\/portfolio-assets\/\d+$/) &&
        request.method === "GET"
      ) {
        const fundId = url.pathname.split("/").pop();

        const assets = await env.DB.prepare(
          `
            SELECT 
              id,
              fund_id,
              asset_symbol,
              asset_name,
              quantity,
              current_price,
              cost_basis,
              current_value,
              weight_percentage,
              target_weight,
              unrealized_pnl,
              unrealized_pnl_percentage,
              price_change_24h,
              last_updated
            FROM portfolio_assets
            WHERE fund_id = ?
            ORDER BY weight_percentage DESC
          `
        )
          .bind(fundId)
          .all();

        return new Response(JSON.stringify(assets.results || []), { headers });
      }

      // 5. GET /api/transactions/:wallet - Get user transaction history
      if (
        url.pathname.match(/^\/api\/transactions\/0x[a-fA-F0-9]{40}$/) &&
        request.method === "GET"
      ) {
        const wallet = url.pathname.split("/").pop()?.toLowerCase();
        const limit = url.searchParams.get("limit") || "50";

        let transactions = await env.DB.prepare(
          `
            SELECT 
              id,
              wallet_address,
              fund_id,
              transaction_type,
              share_quantity,
              share_price,
              total_usd_value,
              transaction_hash,
              status,
              created_at,
              confirmed_at
            FROM transactions
            WHERE wallet_address = ?
            ORDER BY created_at DESC
            LIMIT ?
          `
        )
          .bind(wallet, parseInt(limit))
          .all();

        // If no transactions found for user, return first user's transactions as fallback
        if (!transactions.results || transactions.results.length === 0) {
          transactions = await env.DB.prepare(
            `
              SELECT 
                id,
                wallet_address,
                fund_id,
                transaction_type,
                share_quantity,
                share_price,
                total_usd_value,
                transaction_hash,
                status,
                created_at,
                confirmed_at
              FROM transactions
              ORDER BY created_at DESC
              LIMIT ?
            `
          )
            .bind(parseInt(limit))
            .all();
        }

        return new Response(JSON.stringify(transactions.results || []), {
          headers,
        });
      }

      // 6. GET /api/fund-activities/:id - Get fund manager activities
      if (
        url.pathname.match(/^\/api\/fund-activities\/\d+$/) &&
        request.method === "GET"
      ) {
        const fundId = url.pathname.split("/").pop();
        const limit = url.searchParams.get("limit") || "20";

        const activities = await env.DB.prepare(
          `
          SELECT 
            id,
            fund_id,
            activity_type,
            description,
            amount,
            asset_symbol,
            created_at
          FROM fund_activities
          WHERE fund_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `
        )
          .bind(fundId, parseInt(limit))
          .all();

        return new Response(JSON.stringify(activities.results || []), {
          headers,
        });
      }

      // 7. GET /api/market-data - Get current market data
      if (url.pathname === "/api/market-data" && request.method === "GET") {
        const marketData = await env.DB.prepare(
          `
          SELECT 
            id,
            asset_symbol,
            current_price,
            price_change_24h,
            price_change_7d,
            volume_24h,
            market_cap,
            last_updated
          FROM market_data
          ORDER BY asset_symbol
        `
        ).all();

        return new Response(JSON.stringify(marketData.results || []), {
          headers,
        });
      }

      // ============================================================================
      // USER MANAGEMENT ENDPOINTS
      // ============================================================================

      // Get user by wallet address
      if (
        url.pathname.match(/^\/api\/user\/0x[a-fA-F0-9]{40}$/) &&
        request.method === "GET"
      ) {
        const address = url.pathname.split("/").pop()?.toLowerCase();

        const result = await env.DB.prepare(
          "SELECT * FROM users WHERE wallet_address = ?"
        )
          .bind(address)
          .first();

        if (!result) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers,
          });
        }

        return new Response(JSON.stringify(result), { headers });
      }

      // Check if user exists by email
      if (
        url.pathname.match(/^\/api\/user\/check\/email\/.+$/) &&
        request.method === "GET"
      ) {
        const email = url.pathname.split("/").pop()?.toLowerCase();

        const result = await env.DB.prepare(
          "SELECT wallet_address FROM users WHERE email = ?"
        )
          .bind(email)
          .first();

        return new Response(
          JSON.stringify({
            exists: !!result,
            walletAddress: result ? result.wallet_address : null,
          }),
          { headers }
        );
      }

      // Create new user (Sign Up)
      if (
        (url.pathname === "/api/user/signup" ||
          url.pathname === "/api/signup") &&
        request.method === "POST"
      ) {
        const body = (await request.json()) as SignupRequestBody;
        const {
          walletAddress,
          email,
          phoneNumber,
          displayName,
          authMethod,
          profileImage,
        } = body;

        if (!walletAddress || !authMethod) {
          return new Response(
            JSON.stringify({
              error: "Wallet address and auth method are required",
            }),
            { status: 400, headers }
          );
        }

        // Check if user already exists
        const existingUser = await env.DB.prepare(
          "SELECT * FROM users WHERE wallet_address = ?"
        )
          .bind(walletAddress.toLowerCase())
          .first();

        if (existingUser) {
          return new Response(
            JSON.stringify({
              error: "User already exists",
              user: existingUser,
            }),
            { status: 409, headers }
          );
        }

        const emailValue = email && email !== "" ? email.toLowerCase() : null;
        const phoneValue =
          phoneNumber && phoneNumber !== "" ? phoneNumber : null;
        const displayNameValue =
          displayName && displayName !== "" ? displayName : "Web3 User";
        const profileImageValue =
          profileImage && profileImage !== "" ? profileImage : null;

        const result = await env.DB.prepare(
          `INSERT INTO users (
            wallet_address, email, phone_number, display_name, auth_method, profile_image,
            last_login_at, login_count, created_at, updated_at
          )
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 1, datetime('now'), datetime('now'))
           RETURNING *`
        )
          .bind(
            walletAddress.toLowerCase(),
            emailValue,
            phoneValue,
            displayNameValue,
            authMethod,
            profileImageValue
          )
          .first();

        return new Response(
          JSON.stringify({
            message: "User created successfully",
            user: result,
          }),
          { status: 201, headers }
        );
      }

      // Update user on login
      if (url.pathname === "/api/user/login" && request.method === "POST") {
        const body = (await request.json()) as LoginRequestBody;
        const {
          walletAddress,
          authMethod,
          email,
          phoneNumber,
          displayName,
          profileImage,
        } = body;

        if (!walletAddress) {
          return new Response(
            JSON.stringify({ error: "Wallet address is required" }),
            { status: 400, headers }
          );
        }

        const updates = [
          "last_login_at = datetime('now')",
          "login_count = login_count + 1",
        ];
        const values = [];

        if (authMethod && authMethod !== "") {
          updates.push("auth_method = ?");
          values.push(authMethod);
        }
        if (email && email !== "") {
          updates.push("email = ?");
          values.push(email.toLowerCase());
        }
        if (phoneNumber && phoneNumber !== "") {
          updates.push("phone_number = ?");
          values.push(phoneNumber);
        }
        if (displayName && displayName !== "" && displayName !== "Web3 User") {
          updates.push("display_name = ?");
          values.push(displayName);
        }
        if (profileImage && profileImage !== "") {
          updates.push("profile_image = ?");
          values.push(profileImage);
        }

        updates.push("updated_at = datetime('now')");
        values.push(walletAddress.toLowerCase());

        const result = await env.DB.prepare(
          `UPDATE users SET ${updates.join(
            ", "
          )} WHERE wallet_address = ? RETURNING *`
        )
          .bind(...values)
          .first();

        if (!result) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers,
          });
        }

        return new Response(
          JSON.stringify({
            message: "Login tracked successfully",
            user: result,
          }),
          { headers }
        );
      }

      // Create or update user
      if (url.pathname === "/api/user" && request.method === "POST") {
        const body = (await request.json()) as UserRequestBody;
        const { walletAddress, email, displayName, authMethod, profileImage } =
          body;

        const existingUser = await env.DB.prepare(
          "SELECT * FROM users WHERE wallet_address = ?"
        )
          .bind(walletAddress.toLowerCase())
          .first();

        const emailValue = email && email !== "" ? email.toLowerCase() : null;
        const displayNameValue =
          displayName && displayName !== "" ? displayName : null;
        const authMethodValue =
          authMethod && authMethod !== "" ? authMethod : null;
        const profileImageValue =
          profileImage && profileImage !== "" ? profileImage : null;

        let result;
        if (existingUser) {
          result = await env.DB.prepare(
            `UPDATE users SET 
              email = COALESCE(?, email),
              display_name = COALESCE(?, display_name),
              auth_method = COALESCE(?, auth_method),
              profile_image = COALESCE(?, profile_image),
              updated_at = datetime('now')
             WHERE wallet_address = ?
             RETURNING *`
          )
            .bind(
              emailValue,
              displayNameValue,
              authMethodValue,
              profileImageValue,
              walletAddress.toLowerCase()
            )
            .first();
        } else {
          result = await env.DB.prepare(
            `INSERT INTO users (wallet_address, email, display_name, auth_method, profile_image, last_login_at, login_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, datetime('now'), 1, datetime('now'), datetime('now'))
             RETURNING *`
          )
            .bind(
              walletAddress.toLowerCase(),
              emailValue,
              displayNameValue || "Web3 User",
              authMethodValue || "wallet",
              profileImageValue
            )
            .first();
        }

        return new Response(JSON.stringify(result), { headers });
      }

      // Update user display name
      if (
        url.pathname.match(/^\/api\/user\/0x[a-fA-F0-9]{40}\/name$/) &&
        request.method === "PATCH"
      ) {
        const address = url.pathname.split("/")[3].toLowerCase();
        const body = (await request.json()) as UpdateNameRequestBody;
        const { displayName } = body;

        const result = await env.DB.prepare(
          `UPDATE users SET display_name = ?, updated_at = datetime('now')
           WHERE wallet_address = ?
           RETURNING *`
        )
          .bind(displayName, address)
          .first();

        if (!result) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers,
          });
        }

        return new Response(JSON.stringify(result), { headers });
      }

      // Update user profile
      if (
        url.pathname.match(/^\/api\/user\/0x[a-fA-F0-9]{40}\/profile$/) &&
        request.method === "PATCH"
      ) {
        const address = url.pathname.split("/")[3].toLowerCase();
        const body = (await request.json()) as UpdateProfileRequestBody;
        const { email, displayName, profileImage } = body;

        const updates = [];
        const values = [];

        if (email !== undefined) {
          updates.push("email = ?");
          values.push(email && email !== "" ? email.toLowerCase() : null);
        }
        if (displayName !== undefined) {
          updates.push("display_name = ?");
          values.push(displayName && displayName !== "" ? displayName : null);
        }
        if (profileImage !== undefined) {
          updates.push("profile_image = ?");
          values.push(
            profileImage && profileImage !== "" ? profileImage : null
          );
        }

        if (updates.length === 0) {
          return new Response(
            JSON.stringify({ error: "No fields to update" }),
            { status: 400, headers }
          );
        }

        updates.push(`updated_at = datetime('now')`);
        values.push(address);

        const result = await env.DB.prepare(
          `UPDATE users SET ${updates.join(
            ", "
          )} WHERE wallet_address = ? RETURNING *`
        )
          .bind(...values)
          .first();

        if (!result) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers,
          });
        }

        return new Response(JSON.stringify(result), { headers });
      }

      // Get all users
      if (url.pathname === "/api/users" && request.method === "GET") {
        const result = await env.DB.prepare(
          "SELECT wallet_address, email, phone_number, display_name, auth_method, last_login_at, login_count, created_at FROM users ORDER BY created_at DESC"
        ).all();

        return new Response(JSON.stringify(result.results), { headers });
      }

      // Delete user
      if (
        url.pathname.match(/^\/api\/user\/0x[a-fA-F0-9]{40}$/) &&
        request.method === "DELETE"
      ) {
        const address = url.pathname.split("/").pop()?.toLowerCase();

        const result = await env.DB.prepare(
          "DELETE FROM users WHERE wallet_address = ? RETURNING *"
        )
          .bind(address)
          .first();

        if (!result) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers,
          });
        }

        return new Response(
          JSON.stringify({
            message: "User deleted successfully",
            user: result,
          }),
          { headers }
        );
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers,
      });
    } catch (error: unknown) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          details: errorMessage,
          stack: errorStack,
        }),
        { status: 500, headers }
      );
    }
  },
};
