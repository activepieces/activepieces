import { PieceAuth } from '@activepieces/pieces-framework';

export const aaveAuth = PieceAuth.SecretText({
  displayName: 'The Graph API Key (optional)',
  description: `
A Graph API key increases rate limits when querying the Aave V3 subgraph. Leave blank to use the free public endpoint.

To get a Graph API key:
1. Visit [The Graph Studio](https://thegraph.com/studio/)
2. Create an account and go to **API Keys**
3. Generate a new key and paste it here
  `,
  required: false,
});
