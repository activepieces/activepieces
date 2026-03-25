import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To get your CustomGPT API Key:

1. Log in to [CustomGPT](https://app.customgpt.ai/login)
2. Click the circle in the top right corner of the page and select **My Profile**
3. Select the **API** tab
4. Click the **Create API Key** button at the bottom of the page
5. Copy your API key and paste it below

For more details, visit the [API Keys and Authentication guide](https://docs.customgpt.ai/reference/api-keys-and-authentication).
`;

export const customgptAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdownDescription,
});
