import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, OAuth2PropertyValue } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addNote } from './lib/actions/add-note'
import { createConversation } from './lib/actions/create-conversation'
import { createCustomer } from './lib/actions/create-customer'
import { findConversation } from './lib/actions/find-conversation'
import { findCustomer } from './lib/actions/find-customer'
import { findUser } from './lib/actions/find-user'
import { sendReply } from './lib/actions/send-reply'
import { updateCustomerProperties } from './lib/actions/update-customer-properties'
import { BASE_URL } from './lib/common/api'
import { helpScoutAuth } from './lib/common/auth'
import { conversationAssigned } from './lib/triggers/conversation-assigned'
import { conversationCreated } from './lib/triggers/conversation-created'
import { newCustomer } from './lib/triggers/new-customer'
import { tagsUpdated } from './lib/triggers/tags-updated'

export const helpScout = createPiece({
    displayName: 'Help Scout',
    auth: helpScoutAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/help-scout.png',
    categories: [PieceCategory.CUSTOMER_SUPPORT],
    authors: ['sparkybug'],
    actions: [
        createConversation,
        sendReply,
        addNote,
        createCustomer,
        updateCustomerProperties,
        findConversation,
        findCustomer,
        findUser,
        createCustomApiCallAction({
            auth: helpScoutAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth.access_token}`,
                }
            },
        }),
    ],
    triggers: [conversationCreated, conversationAssigned, newCustomer, tagsUpdated],
})
