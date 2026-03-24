import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To obtain your API key:
1. Log in to your SmartLead account
2. Go to **Settings → General Settings → API**
3. Copy your API key

The API key is passed as a query parameter to all API requests.
`;

export const smartleadAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});
