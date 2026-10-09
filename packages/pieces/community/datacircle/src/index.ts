import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { getBalanceAction } from './lib/actions/get-balance';
import { getLinkedinProfileAction } from './lib/actions/get-linkedin-profile';
import { datacircleAuth } from './lib/auth';
import { DATACIRCLE_API_URL } from './lib/common';

export const datacircle = createPiece({
    displayName: 'Datacircle',
    description:
        'B2B data API with no markup: LinkedIn profiles from Up2Data and HarvestAPI behind one key and one balance, at the provider\'s own price.',
    minimumSupportedRelease: '0.82.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/datacircle.png',
    categories: [PieceCategory.SALES_AND_CRM],
    auth: datacircleAuth,
    authors: ['waynehamadi'],
    actions: [
        getLinkedinProfileAction,
        getBalanceAction,
        createCustomApiCallAction({
            baseUrl: () => DATACIRCLE_API_URL,
            auth: datacircleAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [],
});
