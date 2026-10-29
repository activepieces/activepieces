import { PieceAuth } from '@activepieces/pieces-framework';

const googleTranslateScopes = ['https://www.googleapis.com/auth/cloud-translation', 'email'];

const connectionInstructions = `
Connect with an OAuth client from **your own** Google Cloud project:

1. In [Google Cloud Console](https://console.cloud.google.com/), select or create a project with **billing enabled** (Cloud Translation has a free tier of 500,000 characters/month).
2. **APIs & Services → Library**: enable **Cloud Translation API**.
3. **APIs & Services → OAuth consent screen**: add the scope \`https://www.googleapis.com/auth/cloud-translation\`. While the app is in *Testing*, add the Google accounts that will connect as test users.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type *Web application*. Add the **Redirect URL shown below** to *Authorized redirect URIs*.
5. Paste the **Client ID** and **Client Secret** here, then sign in with a Google account of that project.
`.trim();

export const googleTranslateAuth = PieceAuth.OAuth2({
	description: connectionInstructions,
	authUrl: 'https://accounts.google.com/o/oauth2/auth',
	tokenUrl: 'https://oauth2.googleapis.com/token',
	required: true,
	scope: googleTranslateScopes,
});
