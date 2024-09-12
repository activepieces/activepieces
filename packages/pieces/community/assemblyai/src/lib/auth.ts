import { PieceAuth } from '@activepieces/pieces-framework';

export const assemblyaiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'You can retrieve your API Key within your AssemblyAI [Account Settings](https://www.assemblyai.com/app/account?utm_source=activepieces).',
});
