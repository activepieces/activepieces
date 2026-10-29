import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { TIDYCAL_API_BASE_URL } from './lib/common';
import { tidycalbookingcancelled } from './lib/trigger/cancelled-booking';
import { tidycalnewbooking } from './lib/trigger/new-booking';
import { tidycalnewcontact } from './lib/trigger/new-contacts';
import { tidyCalAuth } from './lib/auth';

export const tidycal = createPiece({
  displayName: 'TidyCal',
  description: 'Streamline your scheduling',
  auth: tidyCalAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/tidycal.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["Salem-Alaa","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => TIDYCAL_API_BASE_URL,
      auth: tidyCalAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
      props: {
        url: {
          description: `Full URL, or a path relative to ${TIDYCAL_API_BASE_URL}`,
          placeholder: '/bookings',
        },
      },
    }),
  ],
  triggers: [tidycalbookingcancelled, tidycalnewbooking, tidycalnewcontact],
});
