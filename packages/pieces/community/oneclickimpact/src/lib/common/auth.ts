import { PieceAuth } from '@activepieces/pieces-framework';

export const oneclickimpactAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'API Key for authenticating with 1ClickImpact',
  required: true,
});
