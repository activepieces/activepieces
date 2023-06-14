import { createPiece } from '@activepieces/pieces-framework';
import { createContact } from './lib/actions/create-contact.action';
import { getOrCreateContact } from './lib/actions/create-or-get-contact.action';
import { sendMessage } from './lib/actions/send-message.action';

export const intercom = createPiece({
    displayName: "Intercom",
    logoUrl: "https://cdn.activepieces.com/pieces/intercom.png",
    triggers: [],
    actions: [getOrCreateContact, createContact, sendMessage],
})