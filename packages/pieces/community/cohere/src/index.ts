import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { generateText } from './lib/actions/generate-text';

const markdownDescription = `
To obtain your Cohere API Key:

1. Go to the [Cohere Dashboard](https://dashboard.cohere.com/api-keys).
2. Sign in or create a free account.
3. Navigate to **API Keys** in the left sidebar.
4. Click **Create Trial Key** (free) or use a production key.
5. Copy the key and paste it below.

You can verify the key by calling GET https://api.cohere.com/v2/models
with the Authorization header set to "Bearer YOUR_KEY".

For more details, see the [Cohere API documentation](https://docs.cohere.com/).
`;

export const cohereAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdownDescription,
});

export const cohere = createPiece({
  displayName: 'Cohere',
  description: 'Generate text using Cohere AI language models',
  auth: cohereAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/light/cohere-color.png',
  authors: [],
  actions: [generateText],
  triggers: [],
});
