import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
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

  logoUrl: 'https://cdn.activepieces.com/pieces/matrix.png',
  minimumSupportedRelease: '0.5.0',
  authors: ['abuaboud'],
  auth: matrixAuth,
  actions: [sendMessage],
  triggers: [],
});
