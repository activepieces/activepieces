import { PieceAuth } from '@activepieces/pieces-framework';

export const dripAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Get it from https://www.getdrip.com/user/edit',
});
