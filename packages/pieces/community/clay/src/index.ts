import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { clayAuth } from './lib/auth';
import { searchCompaniesAction } from './lib/actions/search-companies';
import { searchPeopleAction } from './lib/actions/search-people';
import { sendRowToTableAction } from './lib/actions/send-row-to-table';
import { rowReceivedTrigger } from './lib/triggers/row-received';

export const clay = createPiece({
    displayName: 'Clay',
    description: 'Search Clay\'s GTM database, and move table rows in and out of Clay.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/clay.png',
    categories: [PieceCategory.SALES_AND_CRM],
    auth: clayAuth,
    authors: ['kishanprmr', 'OdaiAhmed99'],
    actions: [
        searchCompaniesAction,
        searchPeopleAction,
        sendRowToTableAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.clay.com/public/v0',
            auth: clayAuth,
            authMapping: async (auth) => ({
                'clay-api-key': auth.secret_text,
            }),
        }),
    ],
    triggers: [rowReceivedTrigger],
});
