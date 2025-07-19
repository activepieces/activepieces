import {
  createPiece,
  PieceAuth,
  PiecePropValueSchema,
  Property,
} from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import {
  AuthenticationType,
  httpClient,
  HttpMethod, createCustomApiCallAction 

} from '@ensemble/pieces-common';
import { createOrUpdateSubscriberAction } from './lib/actions/create-or-update-subscriber.action';
import { getSubscriberAction } from './lib/actions/get-subscriber.action';

export const smailyAuth = PieceAuth.CustomAuth({
  description: `
  1. Click on profile pic (top right corner), navigate to **Preferences**.
  2. Go to **Integrations** tab and click on **Create a New User**.
  3. Copy generated domain, user and password.`,
  required: true,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'User Name',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://${auth.domain}.sendsmaily.net/api/organizations/users.php`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.username,
          password: auth.password,
        },
      });
      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Please provide correct credentials.',
      };
    }
  },
});

export const smaily = createPiece({
  displayName: 'Smaily',
  auth: smailyAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/smaily.png',
  categories: [PieceCategory.MARKETING],
  authors: ['kishanprmr'],
  actions: [createOrUpdateSubscriberAction, getSubscriberAction,
    createCustomApiCallAction({
      auth:smailyAuth,
      baseUrl: (auth)=>{
        return `https://${(auth as PiecePropValueSchema<typeof smailyAuth>).domain}.sendsmaily.net/api`
      },
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${(auth as { username: string }).username}:${
            (auth as { password: string }).password
          }`
        ).toString('base64')}`,
      }),
    })
  ],
  triggers: [],
});
