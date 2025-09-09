import { PieceAuth } from '@activepieces/pieces-framework';

export const vimeoAuth = PieceAuth.SecretText({
  displayName: 'Access Token',
  description: 'Vimeo Personal Access Token (Bearer).',
  required: true,
});

