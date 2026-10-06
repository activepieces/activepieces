import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const googleAdsScopes = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/datamanager',
  'email',
];

const connectionInstructions = `
Connect with an OAuth client from **your own** Google Cloud project:

1. In [Google Cloud Console](https://console.cloud.google.com/), select or create a project. **APIs & Services → Library**: enable **Google Ads API** and **Data Manager API** (the latter only for Customer Match uploads).
2. Open the **Google Ads API** page in the console and check the project's **access level**. New projects get *Test* access (test accounts only). To operate real accounts, apply for *Explorer* or *Basic* access there (Google reviews it, typically within 10 business days).
3. **APIs & Services → OAuth consent screen**: add the scopes \`https://www.googleapis.com/auth/adwords\` and \`https://www.googleapis.com/auth/datamanager\`. While the app is in *Testing*, add the Google accounts that will connect as test users.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type *Web application*. Add the **Redirect URL shown below** to *Authorized redirect URIs*.
5. Paste the **Client ID** and **Client Secret** here and sign in with a Google account that can access the Google Ads accounts you want to automate.

**Login Customer ID (Manager Account)**: fill it only when you reach the accounts through a **manager (MCC) account**: the manager's 10-digit ID. Leave it empty when you connect directly as the advertiser.
`.trim();

export const googleAdsAuth = PieceAuth.OAuth2({
  description: connectionInstructions,
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: googleAdsScopes,
  props: {
    loginCustomerId: Property.ShortText({
      displayName: 'Login Customer ID (Manager Account)',
      description:
        'Only when you access client accounts through a manager (MCC) account: the manager\'s 10-digit customer ID, with or without dashes. Leave empty when connecting directly as the advertiser.',
      required: false,
    }),
  },
});
