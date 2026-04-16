import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addASpaceMember } from './lib/actions/add-a-space-member'
import { findMember } from './lib/actions/find-member'
import { getDirectMessageDetails } from './lib/actions/get-direct-message-details'
import { getMessageDetails } from './lib/actions/get-message'
import { searchMessages } from './lib/actions/search-messages'
import { sendAMessage } from './lib/actions/send-a-message'
import { googleChatApiAuth } from './lib/common/constants'
import { newMention } from './lib/triggers/new-mention'
import { newMessage } from './lib/triggers/new-message'

export const googlechat = createPiece({
    displayName: 'Google Chat',
    auth: googleChatApiAuth,
    minimumSupportedRelease: '0.36.1',
    description:
        'Google Chat is a messaging app that allows you to send and receive messages, create spaces, and more.',
    logoUrl: 'https://cdn.activepieces.com/pieces/googlechat.png',
    categories: [PieceCategory.COMMUNICATION],
    authors: ['gs03-dev', 'onyedikachi-david'],
    actions: [sendAMessage, getDirectMessageDetails, addASpaceMember, getMessageDetails, searchMessages, findMember],
    triggers: [newMessage, newMention],
})
