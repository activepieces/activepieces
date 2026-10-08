import { PieceAuth } from '@activepieces/pieces-framework';

export const googleSearchConsoleAuth = PieceAuth.OAuth2({
  description: `
  1. Sign in to [Google Cloud Console](https://console.cloud.google.com/) and create a project, or pick an existing one.
  2. Go to **APIs & Services > Library**, search for **Google Search Console API** and click **Enable**. It must be enabled in the same project as the OAuth client you create below.
  3. Go to **OAuth consent screen**, choose **External**, fill in the app name and the support and developer emails, and save.
  4. In **Scopes** (Data access), add \`https://www.googleapis.com/auth/webmasters\` and \`email\`, then save.
  5. While the app is in **Testing**, add the Google account you will connect under **Test users**. Tokens of apps in Testing expire after 7 days; publish the app to avoid reconnecting.
  6. Go to **Credentials > Create Credentials > OAuth client ID** and choose **Web application**.
  7. Under **Authorized redirect URIs**, add the Redirect URL shown in this dialog, then click **Create**.
  8. Copy the **Client ID** and **Client Secret** into the fields below.`,
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  scope: ['https://www.googleapis.com/auth/webmasters', 'email'],
  required: true,
});
