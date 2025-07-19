import {
  createCustomApiCallAction,
  HttpMethod,
} from '@ensemble/pieces-common';
import { createPiece, PieceAuth } from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import { calltidycalapi } from './lib/common';
import { tidycalbookingcancelled } from './lib/trigger/cancelled-booking';
import { tidycalnewbooking } from './lib/trigger/new-booking';
import { tidycalnewcontact } from './lib/trigger/new-contacts';

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
  description: 'Streamline your scheduling',
  auth: tidyCalAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/tidycal.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["Salem-Alaa","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => 'https://tidycal.com/api',
      auth: tidyCalAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [tidycalbookingcancelled, tidycalnewbooking, tidycalnewcontact],
});
