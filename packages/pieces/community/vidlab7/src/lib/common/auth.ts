import { PieceAuth } from '@activepieces/pieces-framework';

export const vidlab7Auth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To generate your API key:

1. Log in to [studio.vidlab7.com](https://studio.vidlab7.com/)
2. Click on **API** in the bottom section of the left-hand menu
3. Click the **Generate new key** button at the top right
4. Give your key a descriptive name and click **Generate**
5. Copy and store the key securely (you'll only see it once)
  `,
  required: true,
});
