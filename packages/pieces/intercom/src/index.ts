import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { createContact } from './lib/actions/create-contact.action';
import { getOrCreateContact } from './lib/actions/create-or-get-contact.action';
import { sendMessage } from './lib/actions/send-message.action';

export const intercom = createPiece({
    displayName: "Intercom",
    logoUrl: "https://cdn.activepieces.com/pieces/intercom.png",
    name: "intercom",
    version: packageJson.version,
    triggers: [],
    actions: [getOrCreateContact, createContact, sendMessage],
})