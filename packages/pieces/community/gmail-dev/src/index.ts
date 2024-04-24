import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { gmailNewEmailTrigger } from './lib/triggers/new-email';

export const gmailDevAuth = PieceAuth.OAuth2({
  description: `
  1. Sign in to [Google Cloud Console](https://console.cloud.google.com/).
  2. Create a new project or you can use existing one.
  3. Go to **APIs & Services** and click **Enable APIs & Services**.
  4. Search for **Gmail API** in the search bar and enable it.
  5. Go to **OAuth consent screen** and select **External** type and click create.
  6. Fill App Name, User Support Email, and Developer Contact Information. Click on the Save and Continue button.
  7. Click on **Add or Remove Scopes** and add following scopes and click update.
     - https://www.googleapis.com/auth/gmail.readonly
     - email
  8. Click Save and Continue to finish the Scopes step.
  9. Click on the Add Users button and add a test email You can add your own email).Then finally click Save and Continue to finish the Test Users portion.
  10. Go to **Credentials**. Click on the **Create Credentials** button and select the **OAuth client ID** option.
  11. Select the application type as **Web Application** and fill the Name field.
  12. Add https://www.cloud.activepieces.com/redirect in **Authorized redirect URIs** field, and click on the Create button.
  13. Copy **Client ID** and **Client Secret**.`,

  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: ['email', 'https://www.googleapis.com/auth/gmail.readonly'],
});

export const gmailDev = createPiece({
  displayName: 'Gmail(Developer Edition)',
  description: 'Reading emails is a sensitive scope. This piece requires adding your own OAuth2 app to bypass approval.',
  auth: gmailDevAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/gmail-dev.png',
  authors: ['kishanprmr'],
  actions: [],
  triggers: [gmailNewEmailTrigger],
});
