import { AppConnectionValueForAuthProperty, PieceAuth } from '@activepieces/pieces-framework';
import { nuelinkClient } from './common/client';

export const nuelinkAuth = PieceAuth.SecretText({
  displayName: 'Automation Token (legacy)',
  required: true,
  description: `Works only with **Create Post**, which adds posts to the one collection chosen when the token was made. For every other action, add an **API Key** connection instead.

To get an automation token:
1. Sign in to Nuelink and open **Automations**.
2. Create a new automation for **Activepieces** and pick the collection the posts should go to.
3. Copy the token Nuelink shows and paste it here.`,
  validate: async ({ auth }) => nuelinkClient.validateLegacyToken({ token: auth }),
});

export const nuelinkApiKeyAuth = PieceAuth.CustomAuth({
  displayName: 'API Key (recommended)',
  required: true,
  description: `Works with every Nuelink action: choose the brand and collection, schedule, edit, delete and track posts.

To get an API key:
1. Sign in to Nuelink and open **Settings → API**.
2. Click **Generate API key**, choose how long it stays valid (up to 1 year) and copy it. Nuelink shows it only once.
3. Paste it below. The key acts as your Nuelink user and sees the same brands you do.

To use **Delete Post**, also turn on **Allow AI to perform sensitive actions** on the same page.`,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The key from Nuelink Settings → API.',
      required: true,
    }),
  },
  validate: async ({ auth }) => nuelinkClient.validateApiKey({ apiKey: auth.apiKey }),
});

export const nuelinkAuths = [nuelinkAuth, nuelinkApiKeyAuth];

export type NuelinkAuthValue = AppConnectionValueForAuthProperty<typeof nuelinkAuths>;
