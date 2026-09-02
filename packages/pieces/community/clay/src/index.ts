import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { clayAuth } from './lib/auth';
import { searchCompaniesAction } from './lib/actions/search-companies';
import { searchPeopleAction } from './lib/actions/search-people';

export const clay = createPiece({
    displayName: 'Clay',
    description: 'Search Clay\'s GTM database for people and companies.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/clay.png',
    categories: [PieceCategory.SALES_AND_CRM],
    auth: clayAuth,
    authors: ['kishanprmr'],
    actions: [
        searchCompaniesAction,
        searchPeopleAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.clay.com/public/v0',
            auth: clayAuth,
            authMapping: async (auth) => ({
                'clay-api-key': auth.secret_text,
            }),
        }),
    ],
    triggers: [],
});
