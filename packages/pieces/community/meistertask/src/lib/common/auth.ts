import { PieceAuth, OAuth2AuthorizationMethod } from '@activepieces/pieces-framework';

export const meisterTaskAuth = PieceAuth.OAuth2({
  description: `
  **MeisterTask OAuth2 Setup:**
  
  1. Go to https://developers.meistertask.com/
  2. Create a new application
  3. Set redirect URI to: http://localhost:4200/api/v1/oauth2/callback
  4. Copy Client ID and Client Secret
  5. Enable scopes: userinfo.profile, userinfo.email, meistertask
  
  **For ngrok/production, use your actual domain:**
  - https://your-domain.com/api/v1/oauth2/callback
  
  **Troubleshooting:**
  - Verify redirect URI matches exactly
  - Check all scopes are enabled in MeisterTask app
  - Ensure Client ID/Secret are correct
  - App must use "Authorization Code" grant type
  `,
  authUrl: 'https://www.mindmeister.com/oauth2/authorize',
  tokenUrl: 'https://www.mindmeister.com/oauth2/token',
  required: true,
  scope: ['userinfo.profile', 'userinfo.email', 'meistertask'],
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  extra: {
    response_type: 'code',
  },
});