import { PieceAuth } from '@activepieces/pieces-framework';

export const jinaAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Get your API key from the [Jina AI dashboard](https://jina.ai/api-dashboard).',
  required: true,
})
