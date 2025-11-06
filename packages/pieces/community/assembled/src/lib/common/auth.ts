import { PieceAuth } from '@activepieces/pieces-framework';

export const assembledAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can obtain API key by navigating to [Settings->API](https://app.assembledhq.com/settings/api) page.`,
  required: true,
});
