import { PieceAuth } from '@activepieces/pieces-framework';

export const filloutFormsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
    To obtain your API key:
    1. Log in to your Fillout account
    2. Go to Settings > Developer
    3. Generate your API key
    4. Copy and paste it here
  `,
  required: true,
});
