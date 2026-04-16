import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addContact } from './lib/actions/add-contact'
import { deleteContacts } from './lib/actions/delete-contacts'
import { sendMms } from './lib/actions/send-mms'
import { sendSms } from './lib/actions/send-sms'
import { krispcallAuth } from './lib/auth'
import { triggers } from './lib/triggers'

export type krispcallAuth = {
    apiKey: string
}

export const KrispCall = createPiece({
    displayName: 'KrispCall',
    description:
        'KrispCall is a cloud telephony system for modern businesses, offering advanced features for high-growth startups and modern enterprises.',
    categories: [PieceCategory.COMMUNICATION],
    auth: krispcallAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/krispcall.svg',
    authors: ['deependra321'],
    actions: [addContact, deleteContacts, sendSms, sendMms],
    triggers: triggers,
})
