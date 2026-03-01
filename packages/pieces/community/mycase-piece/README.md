# MyCase Piece

This piece provides integration with MyCase API using OAuth 2.0 authentication.

## Features

### Authentication
- **OAuth 2.0**: Uses Authorization Code grant flow with refresh tokens
- **Automatic Token Management**: Handles access token and refresh token lifecycle
- **Secure**: Follows MyCase's recommended authentication practices

### Actions
- **Get Firm Information**: Retrieve information about the authenticated firm
- **List Contacts**: Retrieve and search contacts with pagination support

## Authentication Setup

### Prerequisites
1. **MyCase Account**: You need an active MyCase account
2. **Client Credentials**: Contact MyCase support to obtain:
   - Client ID
   - Client Secret
   - Redirect URI (must be pre-registered with MyCase)

### OAuth 2.0 Flow
1. **Authorization**: Users are redirected to MyCase authorization server
2. **Code Exchange**: Authorization code is exchanged for access token
3. **API Access**: Access token is used for authenticated API requests
4. **Token Refresh**: Refresh tokens are used to obtain new access tokens

### Configuration
- **Authorization URL**: `https://auth.mycase.com/login_sessions/new`
- **Token URL**: `https://auth.mycase.com/tokens`
- **Token Lifetime**: 24 hours (access token), 2 weeks (refresh token)
- **Rate Limits**: 25 requests per second per client

## API Integration

### Base URL
All API requests are made to: `https://api.mycase.com/v1`

### Authentication Header
```
Authorization: Bearer <access_token>
```

### Error Handling
- **401 Unauthorized**: Access token expired (automatic refresh handled)
- **Rate Limiting**: 25 requests per second limit enforced
- **Scope Validation**: Ensures required permissions for API endpoints

## Building

Run `nx build pieces-mycase-piece` to build the library.
