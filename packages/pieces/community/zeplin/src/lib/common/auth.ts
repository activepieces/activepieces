import { PieceAuth } from '@activepieces/pieces-framework';

export const ziplinAuth = PieceAuth.SecretText({
  displayName: 'Zeplin Personal Access Token',
  description: 'Zeplin Personal Access Token',
  required: true,
});
