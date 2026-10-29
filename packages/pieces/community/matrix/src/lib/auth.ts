import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { MatrixApiError, matrixClient } from './common/client';
import { matrixIds } from './common/ids';

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
      description: 'The client API address of your homeserver, e.g. https://matrix-client.matrix.org (shown under Help & About in Element).',
      required: true,
    }),
    access_token: PieceAuth.SecretText({
      displayName: 'Access Token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      matrixClient.normalizeHomeserver(auth.base_url);
      matrixClient.accessTokenOf(auth);
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Invalid connection.' };
    }
    try {
      const body = await matrixClient.request({ auth, method: HttpMethod.GET, path: matrixIds.clientPath('account', 'whoami') });
      if (!matrixClient.isRecord(body) || typeof body['user_id'] !== 'string') {
        return { valid: false, error: 'The Home Server URL does not point to a Matrix client API.' };
      }
      return { valid: true };
    } catch (error) {
      if (error instanceof MatrixApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid access token.' };
      }
      if (error instanceof MatrixApiError && (error.status === 404 || error.status === 405)) {
        return {
          valid: false,
          error: 'This address does not serve the Matrix client API. Use the homeserver URL shown in Element under Settings > Help & About (e.g. https://matrix-client.matrix.org).',
        };
      }
      return {
        valid: false,
        error: error instanceof Error ? `Could not reach the homeserver: ${error.message}` : 'Could not reach the homeserver.',
      };
    }
  },
  required: true,
});
