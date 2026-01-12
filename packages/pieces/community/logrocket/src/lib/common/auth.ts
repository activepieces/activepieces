import { PieceAuth } from '@activepieces/pieces-framework';

export const logrocketAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your LogRocket API key:

1. **Login to your LogRocket Dashboard**
2. **Go to Settings > General Settings**
3. **Copy your API key** from the API Key section
4. **Paste it here**

Your API key is used to authenticate requests to the LogRocket API.
  `,
  required: true,
});

