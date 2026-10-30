import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { hibiraClient } from './common/client';

const description = `
Connect a Hibira app (Pusher-compatible realtime WebSockets).

1. Sign up at [hibira.io](https://hibira.io/portal) and create an app. The free plan is enough and needs no card.
2. Copy the **App ID**, **Key** and **Secret** from the app page.
3. For push notifications, also copy the **Instance ID** and **Secret Key** from the app's Push tab.
`;

export const hibiraAuth = PieceAuth.CustomAuth({
  displayName: 'Hibira App',
  description,
  required: true,
  props: {
    appId: Property.ShortText({ displayName: 'App ID', required: true }),
    key: Property.ShortText({ displayName: 'Key', required: true }),
    secret: PieceAuth.SecretText({ displayName: 'Secret', required: true }),
    pushInstanceId: Property.ShortText({
      displayName: 'Push Instance ID',
      description: 'Only needed for the push notification actions.',
      required: false,
    }),
    pushSecretKey: PieceAuth.SecretText({
      displayName: 'Push Secret Key',
      description: 'Only needed for the push notification actions.',
      required: false,
    }),
    baseUrl: Property.ShortText({
      displayName: 'API URL',
      description: 'Leave as is unless you use another cluster, such as https://ws-tyo.hibira.io.',
      required: false,
      defaultValue: 'https://ws.hibira.io',
    }),
  },
  validate: async ({ auth }) => {
    try {
      await hibiraClient.channels(auth, { method: 'GET', path: '/channels' });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Hibira rejected the request. Check the app ID, key and secret.',
      };
    }
  },
});
