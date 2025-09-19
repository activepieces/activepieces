
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { emailoctopusAuth } from './lib/common/auth';
import { addUpdateContact } from './lib/actions/add-update-contact';
import { unsubscribeContact } from './lib/actions/unsubscribe-contact';
import { updateContactEmail } from './lib/actions/update-contact-email';
import { addTagToContact } from './lib/actions/add-tag-to-contact';
import { removeTagFromContact } from './lib/actions/remove-tag-from-contact';
import { createList } from './lib/actions/create-list';
import { findContact } from './lib/actions/find-contact';
import { newContact } from './lib/triggers/new-contact';
import { contactUnsubscribes } from './lib/triggers/contact-unsubscribes';
import { emailBounced } from './lib/triggers/email-bounced';
import { emailOpened } from './lib/triggers/email-opened';
import { emailClicked } from './lib/triggers/email-clicked';

export const emailoctopus = createPiece({
    displayName: 'EmailOctopus',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/emailoctopus.png',
    categories: [PieceCategory.MARKETING],
    authors: [],
    auth: emailoctopusAuth,
    actions: [
        addUpdateContact,
        unsubscribeContact,
        updateContactEmail,
        addTagToContact,
        removeTagFromContact,
        createList,
        findContact,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.emailoctopus.com',
            auth: emailoctopusAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth}`,
            }),
        }),
    ],
    triggers: [
        newContact,
        contactUnsubscribes,
        emailBounced,
        emailOpened,
        emailClicked,
    ],
});
    