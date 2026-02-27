import { PieceAuth } from '@activepieces/pieces-framework';

const mycaseAuthDescription = `
## MyCase OAuth 2.0 Setup

### Obtaining Client Credentials
1. Contact MyCase support at [https://www.mycase.com/support/](https://www.mycase.com/support/) to request OAuth 2.0 client credentials
2. Provide your application details and request a client ID and client secret
3. MyCase support will provide you with:
   - **Client ID**: Your OAuth Client ID
   - **Client Secret**: Your OAuth Client secret
   - **Redirect URI**: A pre-configured redirect URI for your application

### Required Permissions
The authorizing user must have the **"Manage your firm's preferences, billing, and payment options"** permission set to **Yes** in MyCase.

### Authorization Flow
MyCase uses OAuth 2.0 Authorization Code Grant flow with the following endpoints:

**Authorization URL**: \`https://auth.mycase.com/login_sessions/new\`
**Token URL**: \`https://auth.mycase.com/tokens\`

### Rate Limits
- 25 requests per second per client
- Access tokens are valid for 24 hours
- Refresh tokens are valid for 2 weeks

For detailed API documentation, visit: [https://mycaseapi.stoplight.io/docs/mycase-api-documentation/k5xpc4jyhkom7-getting-started](https://mycaseapi.stoplight.io/docs/mycase-api-documentation/k5xpc4jyhkom7-getting-started)
`;

export const mycaseAuth = PieceAuth.OAuth2({
  description: mycaseAuthDescription,
  authUrl: 'https://auth.mycase.com/login_sessions/new',
  tokenUrl: 'https://auth.mycase.com/tokens',
  required: true,
  scope: [],
  pkce: true
});
