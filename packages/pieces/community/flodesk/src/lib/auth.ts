import { PieceAuth } from '@activepieces/pieces-framework';

export const flodeskAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Enter your Flodesk API key, which you can get from My Account > Integrations > API keys.',
});
