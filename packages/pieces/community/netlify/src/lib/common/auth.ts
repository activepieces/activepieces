import { PieceAuth } from "@activepieces/pieces-framework";

export const netlifyAuth = PieceAuth.OAuth2({
  description: `
To authenticate with Netlify:

1. Go to your Netlify user settings
2. Navigate to "Applications" → "OAuth applications"
3. Click "New OAuth application"
4. Add https://cloud.activepieces.com/redirect to authorized redirect URIs
5. Copy the Client ID and Client Secret
6. Use the OAuth2 flow below

**Note:** If your team uses SAML SSO, you must grant access to the team when generating your token.
`,
  authUrl: "https://app.netlify.com/authorize",
  tokenUrl: "https://api.netlify.com/oauth/token",
  required: true,
  scope: [],
});
