import { PieceAuth } from '@activepieces/pieces-framework';

export const greenhouseAuth = PieceAuth.OAuth2({
  displayName: 'Greenhouse',
  description: `To connect Greenhouse, you need OAuth2 credentials from a registered Greenhouse partner application.

**Steps to get credentials:**
1. Contact **partner-support@greenhouse.io** to register your integration.
2. Provide: integration name, required scopes, and your redirect URI.
3. Greenhouse will issue a **Client ID** and **Client Secret**.

**Required scopes:** \`harvest:candidates:list\`, \`harvest:candidates:create\`, \`harvest:candidates:update\`, \`harvest:applications:list\`, \`harvest:jobs:list\`, \`harvest:job_posts:list\`, \`harvest:interviews:list\`, \`harvest:scorecards:list\`, \`harvest:notes:create\``,
  authUrl: 'https://auth.greenhouse.io/authorize',
  tokenUrl: 'https://auth.greenhouse.io/token',
  scope: [
    'harvest:candidates:list',
    'harvest:candidates:create',
    'harvest:candidates:update',
    'harvest:applications:list',
    'harvest:jobs:list',
    'harvest:job_posts:list',
    'harvest:interviews:list',
    'harvest:scorecards:list',
    'harvest:notes:create',
  ],
  required: true,
});
