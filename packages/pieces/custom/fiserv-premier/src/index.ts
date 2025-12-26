import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getParty } from './lib/actions/get-party';
import { getPartyList } from './lib/actions/get-party-list';
import { addParty } from './lib/actions/add-party';
import { updateParty } from './lib/actions/update-party';

export const fiservPremierAuth = PieceAuth.CustomAuth({
  description: 'Fiserv Premier API credentials',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL for the Fiserv Premier API (e.g., https://api.fiservapps.com)',
      required: true,
    }),
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Your Fiserv Premier Organization ID',
      required: true,
    }),
  },
});

export const fiservPremier = createPiece({
  displayName: 'Fiserv Premier',
  auth: fiservPremierAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://i.imgur.com/1BOQN9O.png',
  authors: ['vqnguyen1'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  actions: [
    getParty,
    getPartyList,
    addParty,
    updateParty,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as any).baseUrl || 'https://api.fiservapps.com',
      auth: fiservPremierAuth,
      authMapping: async (auth) => {
        const organizationId = (auth as any).organizationId;
        const trnId = crypto.randomUUID();
        return {
          'EFXHeader': JSON.stringify({
            OrganizationId: organizationId,
            TrnId: trnId,
          }),
        };
      },
    }),
  ],
  triggers: [],
});
