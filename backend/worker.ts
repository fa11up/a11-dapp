/**
 * Cloudflare Worker for D1 Database API - With Portfolio Management
 * SECURITY HARDENED VERSION
 */

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  API_KEY?: string; // Optional API key for enhanced security
  RATE_LIMIT_REQUESTS?: string; // Max requests per minute (default: 100)
  RATE_LIMIT_WINDOW?: string; // Time window in seconds (default: 60)
}

// Rate limiting storage
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Security headers
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

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

// Input validation functions
function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function isValidPhoneNumber(phone: string): boolean {
  // E.164 format: +[country code][number] (max 15 digits)
  return /^\+?[1-9]\d{1,14}$/.test(phone);
}

function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength);
}

function isValidPositiveInteger(value: string, max: number = 1000000): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0 && num <= max && value === num.toString();
}

function isValidAuthMethod(method: string): boolean {
  const validMethods = [
    'metamask',
    'coinbase-wallet',
    'walletconnect',
    'inApp',
    'email',
    'phone',
    'google',
    'github',
    'microsoft',
    'discord',
    'x',
    'passkey',
    'guest',
    'wallet'
  ];
  return validMethods.includes(method.toLowerCase());
}

// Rate limiting function
function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now >= entry.resetAt) {
    // New window or expired window
    const resetAt = now + windowSeconds * 1000;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, resetAt: entry.resetAt };
}

// Clean up old rate limit entries periodically
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Get client identifier for rate limiting
function getClientIdentifier(request: Request): string {
  // Use CF-Connecting-IP header (Cloudflare specific)
  const ip = request.headers.get('CF-Connecting-IP') ||
             request.headers.get('X-Forwarded-For') ||
             'unknown';
  return ip.split(',')[0].trim();
}

function corsHeaders(origin: string | null): CorsHeaders {
  const allowedOrigins = [
    "https://a11.fund",
    "https://api.a11.fund",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  const requestOrigin = origin || "";

  // Only return the origin if it's in the whitelist, otherwise don't set CORS header
  const allowOrigin = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : "";

  return {
    "Access-Control-Allow-Origin": allowOrigin || allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  };
}

// Maximum request body size (1MB)
const MAX_BODY_SIZE = 1024 * 1024;

// Validate and parse JSON body with size limit
async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    const contentLength = request.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return null;
    }

    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) {
      return null;
    }

    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Periodic cleanup of rate limit store
    if (Math.random() < 0.01) { // 1% chance per request
      cleanupRateLimitStore();
    }

    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const headers = {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
      ...SECURITY_HEADERS,
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    // Rate limiting
    const clientId = getClientIdentifier(request);
    const maxRequests = parseInt(env.RATE_LIMIT_REQUESTS || "100");
    const windowSeconds = parseInt(env.RATE_LIMIT_WINDOW || "60");

    const rateLimitResult = checkRateLimit(clientId, maxRequests, windowSeconds);

    if (!rateLimitResult.allowed) {
      const resetInSeconds = rateLimitResult.resetAt
        ? Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
        : windowSeconds;

      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Too many requests. Please try again in ${resetInSeconds} seconds.`,
        }),
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": resetInSeconds.toString(),
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt?.toString() || "",
          },
        }
      );
    }

    // Database check
    if (!env.DB) {
      console.error(
        "D1 database binding not found. Check wrangler.toml configuration."
      );
      return new Response(
        JSON.stringify({
          error: "Database not configured",
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

        // Validate fundId is a positive integer
        if (!fundId || !isValidPositiveInteger(fundId, 999999)) {
          return new Response(
            JSON.stringify({ error: "Invalid fund ID" }),
            { status: 400, headers }
          );
        }

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

        // Validate wallet address
        if (!wallet || !isValidEthereumAddress(wallet)) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet address" }),
            { status: 400, headers }
          );
        }

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
        const daysParam = url.searchParams.get("days") || "30";

        // Validate fundId is a positive integer
        if (!fundId || !isValidPositiveInteger(fundId, 999999)) {
          return new Response(
            JSON.stringify({ error: "Invalid fund ID" }),
            { status: 400, headers }
          );
        }

        // Validate days parameter (limit to reasonable range)
        if (!isValidPositiveInteger(daysParam, 3650)) { // Max 10 years
          return new Response(
            JSON.stringify({ error: "Invalid days parameter" }),
            { status: 400, headers }
          );
        }

        const days = parseInt(daysParam, 10);

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
          .bind(fundId, days)
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

        // Validate fundId
        if (!fundId || !isValidPositiveInteger(fundId, 999999)) {
          return new Response(
            JSON.stringify({ error: "Invalid fund ID" }),
            { status: 400, headers }
          );
        }

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
        const limitParam = url.searchParams.get("limit") || "50";

        // Validate wallet address
        if (!wallet || !isValidEthereumAddress(wallet)) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet address" }),
            { status: 400, headers }
          );
        }

        // Validate limit parameter
        if (!isValidPositiveInteger(limitParam, 1000)) { // Max 1000 records
          return new Response(
            JSON.stringify({ error: "Invalid limit parameter" }),
            { status: 400, headers }
          );
        }

        const limit = parseInt(limitParam, 10);

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
          .bind(wallet, limit)
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
        const limitParam = url.searchParams.get("limit") || "20";

        // Validate fundId
        if (!fundId || !isValidPositiveInteger(fundId, 999999)) {
          return new Response(
            JSON.stringify({ error: "Invalid fund ID" }),
            { status: 400, headers }
          );
        }

        // Validate limit parameter
        if (!isValidPositiveInteger(limitParam, 1000)) { // Max 1000 records
          return new Response(
            JSON.stringify({ error: "Invalid limit parameter" }),
            { status: 400, headers }
          );
        }

        const limit = parseInt(limitParam, 10);

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
          .bind(fundId, limit)
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

        // Validate wallet address
        if (!address || !isValidEthereumAddress(address)) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet address" }),
            { status: 400, headers }
          );
        }

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

      // REMOVED: Email enumeration endpoint for security reasons
      // This endpoint allowed attackers to enumerate valid emails in the system
      // If you need to check for existing users, use wallet address lookup instead

      // Create new user (Sign Up)
      if (
        (url.pathname === "/api/user/signup" ||
          url.pathname === "/api/signup") &&
        request.method === "POST"
      ) {
        const body = await parseJsonBody<SignupRequestBody>(request);

        if (!body) {
          return new Response(
            JSON.stringify({ error: "Invalid request body or body too large" }),
            { status: 400, headers }
          );
        }

        const {
          walletAddress,
          email,
          phoneNumber,
          displayName,
          authMethod,
          profileImage,
        } = body;

        // Validate required fields
        if (!walletAddress || !authMethod) {
          return new Response(
            JSON.stringify({
              error: "Wallet address and auth method are required",
            }),
            { status: 400, headers }
          );
        }

        // Validate wallet address format
        if (!isValidEthereumAddress(walletAddress)) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet address format" }),
            { status: 400, headers }
          );
        }

        // Validate auth method
        if (!isValidAuthMethod(authMethod)) {
          return new Response(
            JSON.stringify({ error: "Invalid authentication method" }),
            { status: 400, headers }
          );
        }

        // Validate email if provided
        if (email && email !== "" && !isValidEmail(email)) {
          return new Response(
            JSON.stringify({ error: "Invalid email format" }),
            { status: 400, headers }
          );
        }

        // Validate phone number if provided
        if (phoneNumber && phoneNumber !== "" && !isValidPhoneNumber(phoneNumber)) {
          return new Response(
            JSON.stringify({ error: "Invalid phone number format" }),
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

        // Sanitize and validate inputs
        const emailValue = email && email !== "" ? sanitizeString(email.toLowerCase(), 254) : null;
        const phoneValue =
          phoneNumber && phoneNumber !== "" ? sanitizeString(phoneNumber, 20) : null;
        const displayNameValue =
          displayName && displayName !== "" ? sanitizeString(displayName, 100) : "Web3 User";
        const profileImageValue =
          profileImage && profileImage !== "" ? sanitizeString(profileImage, 500) : null;

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
        const body = await parseJsonBody<LoginRequestBody>(request);

        if (!body) {
          return new Response(
            JSON.stringify({ error: "Invalid request body or body too large" }),
            { status: 400, headers }
          );
        }

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

        // Validate wallet address format
        if (!isValidEthereumAddress(walletAddress)) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet address format" }),
            { status: 400, headers }
          );
        }

        // Validate optional fields
        if (email && email !== "" && !isValidEmail(email)) {
          return new Response(
            JSON.stringify({ error: "Invalid email format" }),
            { status: 400, headers }
          );
        }

        if (phoneNumber && phoneNumber !== "" && !isValidPhoneNumber(phoneNumber)) {
          return new Response(
            JSON.stringify({ error: "Invalid phone number format" }),
            { status: 400, headers }
          );
        }

        if (authMethod && authMethod !== "" && !isValidAuthMethod(authMethod)) {
          return new Response(
            JSON.stringify({ error: "Invalid authentication method" }),
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
          values.push(sanitizeString(authMethod, 50));
        }
        if (email && email !== "") {
          updates.push("email = ?");
          values.push(sanitizeString(email.toLowerCase(), 254));
        }
        if (phoneNumber && phoneNumber !== "") {
          updates.push("phone_number = ?");
          values.push(sanitizeString(phoneNumber, 20));
        }
        if (displayName && displayName !== "" && displayName !== "Web3 User") {
          updates.push("display_name = ?");
          values.push(sanitizeString(displayName, 100));
        }
        if (profileImage && profileImage !== "") {
          updates.push("profile_image = ?");
          values.push(sanitizeString(profileImage, 500));
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
        const body = await parseJsonBody<UserRequestBody>(request);

        if (!body) {
          return new Response(
            JSON.stringify({ error: "Invalid request body or body too large" }),
            { status: 400, headers }
          );
        }

        const { walletAddress, email, displayName, authMethod, profileImage } = body;

        // Validate wallet address
        if (!walletAddress || !isValidEthereumAddress(walletAddress)) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet address format" }),
            { status: 400, headers }
          );
        }

        // Validate optional fields
        if (email && email !== "" && !isValidEmail(email)) {
          return new Response(
            JSON.stringify({ error: "Invalid email format" }),
            { status: 400, headers }
          );
        }

        if (authMethod && authMethod !== "" && !isValidAuthMethod(authMethod)) {
          return new Response(
            JSON.stringify({ error: "Invalid authentication method" }),
            { status: 400, headers }
          );
        }

        const existingUser = await env.DB.prepare(
          "SELECT * FROM users WHERE wallet_address = ?"
        )
          .bind(walletAddress.toLowerCase())
          .first();

        // Sanitize inputs
        const emailValue = email && email !== "" ? sanitizeString(email.toLowerCase(), 254) : null;
        const displayNameValue =
          displayName && displayName !== "" ? sanitizeString(displayName, 100) : null;
        const authMethodValue =
          authMethod && authMethod !== "" ? sanitizeString(authMethod, 50) : null;
        const profileImageValue =
          profileImage && profileImage !== "" ? sanitizeString(profileImage, 500) : null;

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

        // Validate wallet address
        if (!isValidEthereumAddress(address)) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet address format" }),
            { status: 400, headers }
          );
        }

        const body = await parseJsonBody<UpdateNameRequestBody>(request);

        if (!body) {
          return new Response(
            JSON.stringify({ error: "Invalid request body or body too large" }),
            { status: 400, headers }
          );
        }

        const { displayName } = body;

        if (!displayName || displayName.trim() === "") {
          return new Response(
            JSON.stringify({ error: "Display name is required" }),
            { status: 400, headers }
          );
        }

        const sanitizedName = sanitizeString(displayName, 100);

        const result = await env.DB.prepare(
          `UPDATE users SET display_name = ?, updated_at = datetime('now')
           WHERE wallet_address = ?
           RETURNING *`
        )
          .bind(sanitizedName, address)
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

        // Validate wallet address
        if (!isValidEthereumAddress(address)) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet address format" }),
            { status: 400, headers }
          );
        }

        const body = await parseJsonBody<UpdateProfileRequestBody>(request);

        if (!body) {
          return new Response(
            JSON.stringify({ error: "Invalid request body or body too large" }),
            { status: 400, headers }
          );
        }

        const { email, displayName, profileImage } = body;

        // Validate email if provided
        if (email && email !== "" && !isValidEmail(email)) {
          return new Response(
            JSON.stringify({ error: "Invalid email format" }),
            { status: 400, headers }
          );
        }

        const updates = [];
        const values = [];

        if (email !== undefined) {
          updates.push("email = ?");
          values.push(email && email !== "" ? sanitizeString(email.toLowerCase(), 254) : null);
        }
        if (displayName !== undefined) {
          updates.push("display_name = ?");
          values.push(displayName && displayName !== "" ? sanitizeString(displayName, 100) : null);
        }
        if (profileImage !== undefined) {
          updates.push("profile_image = ?");
          values.push(
            profileImage && profileImage !== "" ? sanitizeString(profileImage, 500) : null
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

        // Validate wallet address
        if (!address || !isValidEthereumAddress(address)) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet address format" }),
            { status: 400, headers }
          );
        }

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
      // Log error for debugging but don't expose details to client
      console.error("Error:", error);

      // Return generic error message without stack trace
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: "An unexpected error occurred. Please try again later.",
        }),
        { status: 500, headers }
      );
    }
  },
};
