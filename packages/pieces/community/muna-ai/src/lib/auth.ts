import { PieceAuth } from '@activepieces/pieces-framework';

export const munaAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Go to [Muna Settings → Developer](https://muna.ai/settings/developer) to generate an access key.',
  required: true,
});
