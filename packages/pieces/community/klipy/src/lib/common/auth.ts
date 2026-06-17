import { PieceAuth } from '@activepieces/pieces-framework';

export const klipyAuth = PieceAuth.SecretText({
  displayName: 'App Key',
  description: `To get your App Key:
1. Sign in to your KLIPY account at https://klipy.com
2. Go to your dashboard and open **API Settings**
3. Copy your **App Key**

The App Key is a unique identifier issued by KLIPY for your application.`,
  required: true,
});
