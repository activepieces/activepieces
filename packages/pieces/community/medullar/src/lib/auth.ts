import { PieceAuth } from '@activepieces/pieces-framework';

export const medullarAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use your personal **API KEY**. You can generate one in your [Medullar account profile](https://my.medullar.com/my-account), under the **API Keys** section.',
});
