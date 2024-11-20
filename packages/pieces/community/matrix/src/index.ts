import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendMessage } from './lib/actions/send-message';

export const matrixAuth = PieceAuth.CustomAuth({
  description: `
    To obtain access token & Home server:

    1. Log in to the account you want to get the access token for on Element.
    2. Click on the name in the top left corner of the screen, then select "Settings" from the dropdown menu.
    3. In the Settings dialog, click the "Help & About" tab on the left side of the screen.
    4. Scroll to the bottom of the page and click on the "click to reveal" part of the "Access Token" section.
    5. Copy your access token & Home Server URL and paste them into the fields below.
    `,
  props: {
    base_url: Property.ShortText({
      displayName: 'Home Server',
      required: true,
    }),
    access_token: PieceAuth.SecretText({
      displayName: 'Access Token',
      required: true,
    }),
  },
  required: true,
});

export const matrix = createPiece({
  displayName: 'Matrix',
  description:
    'Open standard for interoperable, decentralized, real-time communication',

  logoUrl: 'https://cdn.activepieces.com/pieces/matrix.png',
  categories: [PieceCategory.COMMUNICATION],
  minimumSupportedRelease: '0.30.0',
  authors: ["MyWay","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: matrixAuth,
  actions: [
    sendMessage,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { base_url: string }).base_url,
      auth: matrixAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${
          (auth as { access_token: string }).access_token
        }`,
      }),
    }),
  ],
  triggers: [],
});
