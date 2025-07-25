
import { createPiece } from '@activepieces/pieces-framework';
import { knackAuth } from './lib/auth';

import { 
    createRecord,
    updateRecord,
    deleteRecord,
    findRecord
} from './lib/actions';
import {
    newFormSubmission,
    newRecord,
    updatedRecord,
    deletedRecord
} from './lib/triggers';

export const knack = createPiece({
    displayName: 'Knack',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/knack.png',
    auth: knackAuth,
    authors: ['activepieces'],
    actions: [
        createRecord,
        updateRecord,
        deleteRecord,
        findRecord
    ],
    triggers: [
        newFormSubmission,
        newRecord,
        updatedRecord
    ],
});    