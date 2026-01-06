# Backend Security Documentation

## Overview

This document outlines all security improvements implemented to protect the backend API and database from common vulnerabilities and attacks.

## Security Improvements Implemented

### 1. Rate Limiting & DDoS Protection

**Implementation:**
- IP-based rate limiting using Cloudflare's `CF-Connecting-IP` header
- Configurable limits via environment variables:
  - `RATE_LIMIT_REQUESTS`: Maximum requests per window (default: 100)
  - `RATE_LIMIT_WINDOW`: Time window in seconds (default: 60)
- Returns HTTP 429 with `Retry-After` header when limit exceeded
- In-memory rate limit store with automatic cleanup

**Configuration:**
```bash
# wrangler.toml
[env.production.vars]
RATE_LIMIT_REQUESTS = "100"
RATE_LIMIT_WINDOW = "60"
```

**Response Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Timestamp when limit resets
- `Retry-After`: Seconds until client can retry

---

### 2. Security Headers

**Headers Applied to All Responses:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Protection:**
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser XSS filtering
- **HSTS**: Enforces HTTPS connections
- **CSP**: Restricts resource loading
- **Referrer-Policy**: Controls referrer information leakage
- **Permissions-Policy**: Disables unnecessary browser features

---

### 3. Input Validation & Sanitization

**Validation Functions:**

#### Ethereum Address Validation
```typescript
isValidEthereumAddress(address: string): boolean
// Validates 0x[40 hexadecimal characters]
```

#### Email Validation
```typescript
isValidEmail(email: string): boolean
// RFC-compliant email validation (max 254 chars)
```

#### Phone Number Validation
```typescript
isValidPhoneNumber(phone: string): boolean
// E.164 format: +[country code][number] (max 15 digits)
```

#### Integer Validation
```typescript
isValidPositiveInteger(value: string, max: number): boolean
// Prevents SQL injection via parseInt
// Validates against maximum value
```

#### Auth Method Validation
```typescript
isValidAuthMethod(method: string): boolean
// Whitelist: metamask, coinbase-wallet, walletconnect, inApp,
//            email, phone, google, github, microsoft, discord,
//            x, passkey, guest, wallet
```

#### String Sanitization
```typescript
sanitizeString(input: string, maxLength: number): string
// Trims whitespace and enforces maximum length
```

**Applied to All User Inputs:**
- Wallet addresses
- Email addresses
- Phone numbers
- Display names
- Profile images
- Query parameters (limit, days, etc.)

---

### 4. SQL Injection Prevention

**Measures Implemented:**

1. **Parameterized Queries Only**
   - All queries use `.bind()` with placeholders (`?`)
   - No string concatenation in SQL queries

2. **Query Parameter Validation**
   - All numeric parameters validated before parsing
   - `parseInt()` only called after validation
   - Maximum values enforced (e.g., days ≤ 3650, limit ≤ 1000)

3. **Dynamic SQL Security**
   - UPDATE queries with dynamic fields use safe array joining
   - All values still bound via parameterized queries
   - No user input directly concatenated into SQL

**Example:**
```typescript
// BEFORE (vulnerable):
.bind(fundId, parseInt(days))

// AFTER (secure):
if (!isValidPositiveInteger(daysParam, 3650)) {
  return error response
}
const days = parseInt(daysParam, 10);
.bind(fundId, days)
```

---

### 5. Request Body Security

**Implementation:**
- Maximum body size: 1MB (1024 * 1024 bytes)
- Content-Length header validation
- Safe JSON parsing with try-catch
- Returns 400 for oversized or malformed bodies

**parseJsonBody Function:**
```typescript
async function parseJsonBody<T>(request: Request): Promise<T | null>
```

**Protection Against:**
- Memory exhaustion attacks
- JSON bomb attacks
- Malformed JSON exploitation

---

### 6. Error Handling & Information Disclosure Prevention

**Before:**
```typescript
// Exposed stack traces and internal error details
{
  error: "Internal server error",
  details: errorMessage,
  stack: errorStack  // SECURITY RISK!
}
```

**After:**
```typescript
// Generic error message only
{
  error: "Internal server error",
  message: "An unexpected error occurred. Please try again later."
}
```

**Error Logging:**
- Detailed errors logged to console for debugging
- Only generic messages returned to clients
- Prevents information leakage to attackers

---

### 7. Email Enumeration Prevention

**Removed Endpoint:**
```
GET /api/user/check/email/:email
```

**Reason:**
- Allowed attackers to enumerate valid emails
- Privacy violation
- Could be used for targeted phishing

**Alternative:**
- Use wallet address lookup instead
- Client-side validation only

---

### 8. CORS Security Enhancements

**Improvements:**
- Strict origin whitelist validation
- Added `X-API-Key` to allowed headers for future authentication
- Only whitelisted origins receive CORS headers

**Allowed Origins:**
```
https://a11.fund
https://api.a11.fund
http://localhost:5173
http://localhost:3000
```

---

### 9. Database Security Best Practices

**Implemented:**
1. ✅ Prepared statements with parameter binding
2. ✅ Input validation before all queries
3. ✅ Least privilege principle (read-only where possible)
4. ✅ No dynamic table/column names from user input
5. ✅ UNIQUE constraints on critical fields
6. ✅ Foreign key constraints for referential integrity

**From schema.sql:**
- Unique constraints on wallet_address, email, phone_number
- Foreign key constraints on fund_id references
- Indexes on frequently queried columns
- NOT NULL constraints on critical fields

---

## Security Checklist

### ✅ Implemented
- [x] Rate limiting & DDoS protection
- [x] Security headers (HSTS, CSP, X-Frame-Options, etc.)
- [x] Input validation for all user inputs
- [x] String sanitization with length limits
- [x] SQL injection prevention
- [x] Request body size limits
- [x] Safe error handling (no information disclosure)
- [x] Email enumeration prevention
- [x] CORS whitelist enforcement
- [x] Parameterized database queries
- [x] Validation before parseInt/parseFloat
- [x] Ethereum address validation
- [x] Email format validation
- [x] Phone number validation
- [x] Auth method whitelist

### 🔄 Recommended (Not Yet Implemented)
- [ ] API key authentication for sensitive endpoints
- [ ] JWT token-based authentication
- [ ] Request signing/HMAC validation
- [ ] Audit logging for sensitive operations
- [ ] Database connection pooling limits
- [ ] Automated security scanning in CI/CD
- [ ] Web Application Firewall (WAF) rules
- [ ] Database encryption at rest
- [ ] Secrets management via Cloudflare Secrets
- [ ] CAPTCHA for signup endpoint
- [ ] Account lockout after failed attempts
- [ ] Two-factor authentication

---

## Configuration

### Environment Variables

Add to your `wrangler.toml`:

```toml
[env.production]
name = "a11-dapp-backend"

[env.production.vars]
RATE_LIMIT_REQUESTS = "100"      # Max requests per window
RATE_LIMIT_WINDOW = "60"         # Window in seconds
ALLOWED_ORIGINS = "https://a11.fund,https://api.a11.fund"

# Optional: Future API key authentication
# API_KEY = "your-secret-api-key"

[[env.production.d1_databases]]
binding = "DB"
database_name = "a11-dapp-database"
database_id = "your-database-id"
```

### Development Environment

```toml
[env.development]
name = "a11-dapp-backend-dev"

[env.development.vars]
RATE_LIMIT_REQUESTS = "1000"     # More lenient for development
RATE_LIMIT_WINDOW = "60"
```

---

## Testing Security

### Test Rate Limiting
```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl https://api.a11.fund/api/health
done
# Expected: 101st request returns 429
```

### Test Input Validation
```bash
# Invalid wallet address
curl -X GET https://api.a11.fund/api/user/0xinvalid
# Expected: 400 Bad Request

# SQL injection attempt
curl -X GET "https://api.a11.fund/api/fund-performance/1?days=100';DROP TABLE users;--"
# Expected: 400 Bad Request (validation fails)

# Oversized request body
curl -X POST https://api.a11.fund/api/signup \
  -H "Content-Type: application/json" \
  -d "$(head -c 2000000 /dev/urandom | base64)"
# Expected: 400 Bad Request
```

### Test Security Headers
```bash
curl -I https://api.a11.fund/api/health
# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Common Vulnerabilities Mitigated

| Vulnerability | Status | Mitigation |
|--------------|--------|------------|
| SQL Injection | ✅ Fixed | Parameterized queries + validation |
| XSS (Cross-Site Scripting) | ✅ Fixed | Security headers + input sanitization |
| CSRF (Cross-Site Request Forgery) | ⚠️ Partial | CORS whitelist (JWT recommended) |
| Information Disclosure | ✅ Fixed | Generic error messages |
| Email Enumeration | ✅ Fixed | Endpoint removed |
| Rate Limiting | ✅ Fixed | IP-based rate limiting |
| DDoS | ✅ Improved | Rate limiting + Cloudflare protection |
| Clickjacking | ✅ Fixed | X-Frame-Options: DENY |
| MIME Sniffing | ✅ Fixed | X-Content-Type-Options: nosniff |
| Insecure Transport | ✅ Fixed | HSTS header |
| Request Smuggling | ✅ Fixed | Body size limits |
| Memory Exhaustion | ✅ Fixed | Request size limits |
| Integer Overflow | ✅ Fixed | Maximum value validation |
| Command Injection | N/A | No shell commands executed |
| Path Traversal | N/A | No file system access |

---

## Security Contact

For security issues, please contact the development team immediately.

**Do NOT open public GitHub issues for security vulnerabilities.**

---

## Changelog

### 2025-01-06 - Initial Security Hardening
- Implemented rate limiting
- Added comprehensive input validation
- Secured error handling
- Added security headers
- Removed email enumeration endpoint
- Implemented request body size limits
- Strengthened SQL injection prevention
- Added input sanitization

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/platform/security/)
- [D1 Database Security](https://developers.cloudflare.com/d1/platform/security/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
