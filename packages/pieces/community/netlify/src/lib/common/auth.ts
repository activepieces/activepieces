import { PieceAuth, Property } from "@activepieces/pieces-framework";

export const netlifyAuth = PieceAuth.CustomAuth({
  description: `
To authenticate with Netlify, you have two options:

**Option 1: Personal Access Token (Recommended for testing)**
1. Go to your Netlify user settings
2. Navigate to "Applications" → "Personal access tokens"
3. Click "New access token"
4. Enter a descriptive name
5. Select "Allow access to my SAML-based Netlify team" if needed
6. Choose an expiration date
7. Click "Generate token"
8. Copy the token and paste it below

**Option 2: OAuth2 (Required for public integrations)**
1. Go to your Netlify user settings
2. Navigate to "Applications" → "OAuth applications"
3. Click "New OAuth application"
4. Add https://cloud.activepieces.com/redirect to authorized redirect URIs
5. Copy the Client ID and Client Secret
6. Use the OAuth2 flow below

**Note:** If your team uses SAML SSO, you must grant access to the team when generating your token.
`,
  required: true,
  props: {
    authType: Property.StaticDropdown({
      displayName: "Authentication Type",
      description: "Choose your authentication method",
      required: true,
      options: {
        options: [
          { label: "Personal Access Token", value: "pat" },
          { label: "OAuth2", value: "oauth2" },
        ],
      },
      defaultValue: "pat",
    }),
    accessToken: PieceAuth.SecretText({
      displayName: "Access Token",
      description: "Your Netlify Personal Access Token or OAuth2 Access Token",
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: "Authentication is required",
      };
    }
    
    if (!auth.accessToken) {
      return {
        valid: false,
        error: "Access token is required",
      };
    }

    return {
      valid: true,
    };
  },
});
