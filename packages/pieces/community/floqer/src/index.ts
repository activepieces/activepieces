import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addRowsAction } from './lib/actions/add-rows';
import { runRowsAction } from './lib/actions/run-rows';
import { runShortcutAction } from './lib/actions/run-shortcut';
import { floqerAuth } from './lib/auth';
import { FLOQER_BASE_URL } from './lib/common/client';

export const floqer = createPiece({
    displayName: 'Floqer',
    description:
        'Run Floqer shortcuts and push rows into workflow sheets.',
    minimumSupportedRelease: '0.82.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/floqer.png',
    categories: [PieceCategory.SALES_AND_CRM],
    auth: floqerAuth,
    authors: ['OdaiAhmed99'],
    actions: [
        runShortcutAction,
        addRowsAction,
        runRowsAction,
        createCustomApiCallAction({
            baseUrl: () => FLOQER_BASE_URL,
            auth: floqerAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [],
});
