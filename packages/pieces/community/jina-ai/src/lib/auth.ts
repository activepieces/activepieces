import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
You can get your API key from [Jina AI](https://jina.ai).
`;

export const jinaAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
})
