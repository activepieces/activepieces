# External JWT Authentication - Security Configuration

## Environment Variables

### Required Environment Variables

```bash
# JWT Configuration
IDP_ISSUER=https://swsagent.com
IDP_AUDIENCE=ap-embed
IDP_JWKS_URL=https://swsagent.com/.well-known/jwks.json

# Embed Mode
SWS_EMBED_MODE=true
```

### Environment Variable Details

- **IDP_ISSUER**: The JWT issuer (iss claim) that will be verified
- **IDP_AUDIENCE**: The JWT audience (aud claim) that will be verified  
- **IDP_JWKS_URL**: URL to fetch the JSON Web Key Set for JWT verification
- **SWS_EMBED_MODE**: When `true`, enables embed mode with cross-site cookie support

## Security Features

### 1. Rate Limiting

**Endpoint**: `POST /v1/authentication/external`

- **Limit**: 30 requests per minute
- **Key Generation**: `{IP}:{JWT_SUBJECT}`
- **Scope**: Per IP address and JWT subject combination

```typescript
rateLimit: {
  max: 30,
  timeWindow: '1 minute',
  keyGenerator: (request) => {
    const ip = extractClientRealIp(request)
    const subject = extractSubjectFromJWT(request)
    return `${ip}:${subject}`
  }
}
```

### 2. Session Cookie Security

**Cookie Name**: `ap_token`

#### Security Flags

- **HttpOnly**: `true` - Prevents JavaScript access
- **Secure**: `true` - Only sent over HTTPS
- **SameSite**: Dynamic based on embed mode
  - `none` when `SWS_EMBED_MODE=true` (cross-site embedding)
  - `lax` when `SWS_EMBED_MODE=false` (same-site usage)
- **MaxAge**: 7 days (604,800 seconds)
- **Path**: `/` (available site-wide)

#### Cookie Configuration

```typescript
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: isEmbedMode ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
}
```

### 3. Structured Logging

#### JWT Verification Logs

**Attempt Log**:
```json
{
  "issuer": "https://swsagent.com",
  "audience": "ap-embed", 
  "jwksUrl": "https://swsagent.com/.well-known/jwks.json",
  "tokenLength": 245,
  "tokenPrefix": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "level": "info",
  "message": "JWT verification attempt"
}
```

**Success Log**:
```json
{
  "sub": "1234567890",
  "iss": "https://swsagent.com",
  "aud": "ap-embed",
  "workspace_id": "workspace-123",
  "email": "test@example.com",
  "exp": 1640995200,
  "iat": 1640908800,
  "level": "info",
  "message": "JWT verification successful"
}
```

**Error Log**:
```json
{
  "error": "Invalid token",
  "issuer": "https://swsagent.com",
  "audience": "ap-embed",
  "tokenLength": 245,
  "level": "error",
  "message": "JWT verification failed"
}
```

#### Authentication Logs

**Attempt Log**:
```json
{
  "sub": "1234567890",
  "email": "test@example.com",
  "iss": "https://swsagent.com",
  "workspace_id": "workspace-123",
  "hasWorkspaceId": true,
  "level": "info",
  "message": "External JWT authentication attempt"
}
```

**Success Log**:
```json
{
  "userId": "user-123",
  "platformId": "platform-123", 
  "projectId": "project-123",
  "isExistingUser": false,
  "workspaceId": "workspace-123",
  "userIdentityId": "identity-123",
  "level": "info",
  "message": "External JWT authentication successful - new user created"
}
```

### 4. Token Security

#### Never Logged
- Full JWT tokens are never logged
- Only token length and prefix (first 20 chars) are logged
- Sensitive user data is excluded from logs

#### JWT Verification
- Uses JWKS (JSON Web Key Set) for key rotation support
- Supports RS256, RS384, RS512 algorithms
- Validates issuer, audience, and expiration
- Caches signing keys for 10 minutes

## Testing

### Test Coverage

1. **Cookie Security Tests**
   - SameSite behavior in embed mode vs normal mode
   - HttpOnly and Secure flags
   - MaxAge and Path settings

2. **Rate Limiting Tests**
   - IP + subject based rate limiting
   - Token extraction for rate limiting key
   - Fallback behavior without token

3. **Logging Tests**
   - Structured log format verification
   - Token privacy protection
   - Error logging without sensitive data

4. **Frontend Cookie Tests**
   - Cookie reading priority (cookie > localStorage > sessionStorage)
   - JWT expiration validation
   - Storage event dispatching

### Running Tests

```bash
# Backend tests
npm test packages/server/api/src/app/authentication/external-jwt-auth.service.test.ts
npm test packages/server/api/src/app/authentication/authentication.controller.test.ts
npm test packages/server/api/src/app/authentication/embed-mode-cookie.test.ts

# Frontend tests  
npm test packages/react-ui/src/lib/authentication-session.test.ts
```

## Security Considerations

### 1. Cross-Site Embedding
- When `SWS_EMBED_MODE=true`, cookies use `SameSite=None`
- Requires HTTPS for `Secure` flag to work
- Suitable for embedding in iframes across domains

### 2. Rate Limiting
- Prevents brute force attacks on JWT verification
- Combines IP and subject for granular control
- Graceful handling of malformed JWTs

### 3. Logging
- No sensitive data in logs
- Structured format for monitoring
- Error tracking without token exposure

### 4. Cookie Security
- HttpOnly prevents XSS attacks
- Secure flag enforces HTTPS
- Proper SameSite configuration for use case

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Ensure HTTPS is enabled for production
- [ ] Configure JWKS endpoint accessibility
- [ ] Set up log monitoring for authentication events
- [ ] Test rate limiting behavior
- [ ] Verify cookie flags in browser dev tools
- [ ] Test cross-site embedding if applicable
