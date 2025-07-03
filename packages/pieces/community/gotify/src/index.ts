import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendNotification } from './lib/actions/send-notification';

export const gotifyAuth = PieceAuth.CustomAuth({
  description: `
    To obtain a token:

    1. Log in to your Gotify instance.
    2. Click on Apps
    3. Select the Eye icon in the same row as your App to copy your token, or CREATE APPLICATION if you do not have one app yet.
    4. Copy your access token & and paste them into the fields below.
    `,
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'Gotify Instance URL',
      required: true,
    }),
    app_token: PieceAuth.SecretText({
      displayName: 'App Token',
      description: 'Gotify App Token',
      required: true,
    }),
  },
  required: true,
});

export const gotify = createPiece({
  displayName: 'Gotify',
  description: 'Self-hosted push notification service',

  logoUrl: 'https://cdn.activepieces.com/pieces/gotify.png',
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["MyWay","kishanprmr","khaledmashaly","abuaboud"],
  auth: gotifyAuth,
  actions: [sendNotification],
  triggers: [],
});
