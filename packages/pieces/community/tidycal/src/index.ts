import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { AppConnectionType, PieceCategory } from '@activepieces/shared';
import { calltidycalapi } from './lib/common';
import { tidycalbookingcancelled } from './lib/trigger/cancelled-booking';
import { tidycalnewbooking } from './lib/trigger/new-booking';
import { tidycalnewcontact } from './lib/trigger/new-contacts';
import { tidyCalAuth } from './lib/auth';

const markdown = `
# Personal Access Token
1- Visit https://tidycal.com/integrations/oauth and click on "Create a new token"
2- Enter a name for your token and click on "Create"
`;
export const tidycal = createPiece({
  displayName: 'TidyCal',
  description: 'Streamline your scheduling',
  auth: tidyCalAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/tidycal.png',
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
