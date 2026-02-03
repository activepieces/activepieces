import { PieceAuth } from '@activepieces/pieces-framework';

export const asknewsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To obtain your AskNews API key:

1. Visit [AskNews](https://asknews.app)
2. Sign up or log in to your account
3. Click on your profile and navigate to 'Settings' > 'API Credentials'
4. Generate a new API key
5. Copy and paste the key here
`,
  required: true,
});
