import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { tidycalbookingcancelled } from './lib/trigger/cancelled-booking';
import { tidycalnewbooking } from './lib/trigger/new-booking';
import { tidycalnewcontact } from './lib/trigger/new-contacts';
import { calltidycalapi } from './lib/common';
import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';

const markdown = `
# Personal Access Token
1- Visit https://tidycal.com/integrations/oauth and click on "Create a new token"
2- Enter a name for your token and click on "Create"
`;
export const tidyCalAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdown,
  required: true,
  validate: async ({ auth }) => {
    try {
      await calltidycalapi(HttpMethod.GET, 'bookings', auth, undefined);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});

export const tidycal = createPiece({
  displayName: 'TidyCal',
  auth: tidyCalAuth,
  minimumSupportedRelease: '0.7.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/tidycal.png',
  authors: ['Salem-Alaa'],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => 'https://tidycal.com/api',
      auth: tidyCalAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [tidycalbookingcancelled, tidycalnewbooking, tidycalnewcontact],
});
