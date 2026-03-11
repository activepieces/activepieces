import { PieceAuth } from '@activepieces/pieces-framework';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'Private API Key',
  required: true,
  description:
    'Get your private API key from Klaviyo: **Account Settings → API Keys → Create Private API Key**. The key should start with `pk_`.',
});
