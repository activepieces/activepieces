import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendNotification } from './lib/actions/send-notification';

export const ntfyAuth = PieceAuth.CustomAuth({
  description: `
  To obtain a token:

  1. Log in to your Ntfy instance.
  2. Click on Account
  3. Go under, on Access tokens and click on the button icon to copy your Token or CREATE ACCESS TOKEN if you do not have
  4. Please pay attention to the expiration time when copying/creating a Token.
  4. Copy your access token & and paste them into the fields below.
  `,
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'Ntfy Instance URL',
      required: true,
    }),
    access_token: PieceAuth.SecretText({
      displayName: 'Access Token',
      description: 'Ntfy Access Token',
      required: false,
    }),
  },
  required: true,
});

export const ntfy = createPiece({
  displayName: 'ntfy',
  description: 'Notification management made easy',

  logoUrl: 'https://cdn.activepieces.com/pieces/ntfy.png',
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.COMMUNICATION],
  auth: ntfyAuth,
  authors: ["MyWay","facferreira","la3rence","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  actions: [
    sendNotification,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { base_url: string }).base_url,
      auth: ntfyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${
          (auth as { access_token: string }).access_token
        }`,
      }),
    }),
  ],
  triggers: [],
});
