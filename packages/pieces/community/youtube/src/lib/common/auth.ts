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

export async function getAccessToken(auth: OAuth2PropertyValue): Promise<string> {
  return auth.access_token;
}

// Helper to revoke access and refresh tokens via Google's endpoint
export async function revokeTokens(auth: OAuth2PropertyValue): Promise<void> {
  const refreshToken = getRefreshToken(auth);
  const tokens = [auth.access_token, refreshToken].filter(
    (token): token is string => typeof token === 'string' && token.length > 0,
  );
  for (const token of tokens) {
    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }
}

function getRefreshToken(auth: OAuth2PropertyValue): string | undefined {
  const refreshToken = auth.data['refresh_token'];
  return typeof refreshToken === 'string' ? refreshToken : undefined;
}