import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { clayAuth } from './lib/auth';
import { createRecordAction } from './lib/actions/create-record';
import { updateRecordAction } from './lib/actions/update-record';
import { findRowAction } from './lib/actions/find-row';
import { searchCompaniesAction } from './lib/actions/search-companies';
import { searchPeopleAction } from './lib/actions/search-people';

export const clay = createPiece({
    displayName: 'Clay',
    description: 'Enrich, search, and sync data with your Clay tables and GTM database.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/clay.png',
    categories: [PieceCategory.SALES_AND_CRM],
    auth: clayAuth,
    authors: ['kishanprmr'],
    actions: [
        createRecordAction,
        updateRecordAction,
        findRowAction,
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
