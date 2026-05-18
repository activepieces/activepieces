import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendNotification } from './lib/actions/send-notification';

export const pushoverAuth = PieceAuth.CustomAuth({
  description: `
    To obtain the api token:

    1. Log in to Pushover.
    2. Click on your Application or on Create an Application/API Token
    3. Copy the API Token/Key.

    To obtain the user key:
    1. Log in to Pushover
    2. Copy your Your User Key

    Note if you want to send the message to your group, you should specify a group key instead of the user key
    `,
  props: {
    api_token: PieceAuth.SecretText({
      displayName: 'Api Token',
      description: 'Pushover Api Token',
      required: true,
    }),
    user_key: PieceAuth.SecretText({
      displayName: 'User Key',
      description: 'Pushover User Key',
      required: true,
    }),
  },
  required: true,
});

export const pushover = createPiece({
  displayName: 'Pushover',
  description: 'Simple push notification service',

  logoUrl: 'https://cdn.activepieces.com/pieces/pushover.png',
  categories: [PieceCategory.COMMUNICATION],
  minimumSupportedRelease: '0.30.0',
  authors: ["MyWay","Vitalini","kishanprmr","khaledmashaly","abuaboud"],
  auth: pushoverAuth,
  actions: [sendNotification],
  triggers: [],
});
