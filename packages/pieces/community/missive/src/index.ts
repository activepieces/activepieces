import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { missiveAuth } from './lib/common/auth';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { createDraftPost } from './lib/actions/create-draft-post';
import { createTask } from './lib/actions/create-task';
import { findContact } from './lib/actions/find-contact';
import { newMessage } from './lib/triggers/new-message';
import { newComment } from './lib/triggers/new-comment';
import { newContact } from './lib/triggers/new-contact';
import { newContactBook } from './lib/triggers/new-contact-book';
import { newContactGroup } from './lib/triggers/new-contact-group';

export const missive = createPiece({
    displayName: 'Missive',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/missive.png',
    categories: [PieceCategory.COMMUNICATION, PieceCategory.SALES_AND_CRM],
    authors: ['owuzo', 'onyedikachi-david'],
    auth: missiveAuth,
    actions: [
        createContact,
        updateContact,
        createDraftPost,
        createTask,
        findContact,
        createCustomApiCallAction({
            baseUrl: () => 'https://public.missiveapp.com/v1',
            auth: missiveAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth}`,
            }),
        }),
    ],
    triggers: [
        newMessage,
        newComment,
        newContact,
        newContactBook,
        newContactGroup,
    ],
});
    