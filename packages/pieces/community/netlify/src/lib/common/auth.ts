import { PieceAuth } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { NETLIFY_API_BASE } from "./client";

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
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<NetlifyUser>({
        method: HttpMethod.GET,
        url: `${NETLIFY_API_BASE}/user`,
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return response.body?.email || response.body?.full_name || undefined;
    } catch {
      return undefined;
    }
  },
});

type NetlifyUser = { email?: string; full_name?: string };
