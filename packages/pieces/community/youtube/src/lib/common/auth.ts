import { PieceAuth } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const youtubeAuth = PieceAuth.OAuth2({
  description: `
    1. Sign in to [Google Cloud Console](https://console.cloud.google.com/).
    2. Create a new project or you can use existing one.
    3. Go to **APIs & Services** and click **Enable APIs & Services**.
    4. Search for **YouTube API** in the search bar and enable it.
    5. Go to **OAuth consent screen** and select **External** type and click create.
    6. Fill App Name, User Support Email, and Developer Contact Information. Click on the Save and Continue button.
    7. Click on **Add or Remove Scopes** and add following scopes and click update.
       - https://www.googleapis.com/auth/youtube
       - https://www.googleapis.com/auth/youtube.readonly
       - https://www.googleapis.com/auth/youtube.upload	
       - https://www.googleapis.com/auth/youtube.force-ssl
    8. Click Save and Continue to finish the Scopes step.
    9. Click on the Add Users button and add a test email You can add your own email).Then finally click Save and Continue to finish the Test Users portion.
    10. Go to **Credentials**. Click on the **Create Credentials** button and select the **OAuth client ID** option.
    11. Select the application type as **Web Application** and fill the Name field.
    12. Add https://cloud.activepieces.com/redirect in **Authorized redirect URIs** field, and click on the Create button.
    13. Copy **Client ID** and **Client Secret**.`,

  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ],
});

// Helper to get a valid access token, refreshing if needed
export async function getAccessToken(auth: OAuth2PropertyValue): Promise<string> {
  if (!auth.refresh_token || !auth.expires_in || !auth.expires_at) {
    return auth.access_token;
  }
  const expiresAt = typeof auth.expires_at === 'string' ? Date.parse(auth.expires_at) : auth.expires_at;
  if (Date.now() < expiresAt - 60000) {
    return auth.access_token;
  }
  // Refresh the token
  const params = new URLSearchParams({
    client_id: auth.client_id,
    client_secret: auth.client_secret,
    refresh_token: auth.refresh_token,
    grant_type: 'refresh_token',
  });
  const response = await httpClient.sendRequest<any>({
    method: HttpMethod.POST,
    url: 'https://oauth2.googleapis.com/token',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!response.body.access_token) {
    throw new Error('Failed to refresh YouTube access token');
  }
  return response.body.access_token;
}

// Helper to revoke access and refresh tokens via Google's endpoint
export async function revokeTokens(auth: OAuth2PropertyValue): Promise<void> {
  const tokens = [auth.access_token, auth.refresh_token].filter(Boolean);
  for (const token of tokens) {
    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }
}