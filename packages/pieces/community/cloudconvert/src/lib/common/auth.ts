import { PieceAuth } from '@activepieces/pieces-framework';

export const cloudconvertAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Create an API key at https://cloudconvert.com/dashboard/api/v2/keys and paste it here.',
  required: true,
});

