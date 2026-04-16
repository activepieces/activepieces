import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addFaqItem } from './lib/actions/add-faq-item'
import { addVideo } from './lib/actions/add-video'
import { addWebsite } from './lib/actions/add-website'
import { createChatbotReply } from './lib/actions/create-chatbot-reply'
import { createFaq } from './lib/actions/create-faq'
import { startTraining } from './lib/actions/start-training'
import { aidbaseAuth } from './lib/common/auth'
import { API_BASE_URL } from './lib/common/client'
import { emailPriorityChanged } from './lib/triggers/email-priority-changed'
import { emailReceived } from './lib/triggers/email-received'
import { emailSent } from './lib/triggers/email-sent'
import { emailStatusChanged } from './lib/triggers/email-status-changed'
import { ticketCreated } from './lib/triggers/ticket-created'
import { ticketNewComment } from './lib/triggers/ticket-new-comment'
import { ticketPriorityChanged } from './lib/triggers/ticket-priority-changed'
import { ticketStatusChanged } from './lib/triggers/ticket-status-changed'

export const aidbase = createPiece({
    displayName: 'Aidbase',
    auth: aidbaseAuth,
    minimumSupportedRelease: '0.36.1',
    categories: [PieceCategory.CUSTOMER_SUPPORT, PieceCategory.COMMUNICATION],
    logoUrl: 'https://cdn.activepieces.com/pieces/aidbase.png',
    authors: ['Prabhukiran161', 'sanket-a11y'],
    actions: [
        addVideo,
        addWebsite,
        addFaqItem,
        createFaq,
        createChatbotReply,
        startTraining,
        createCustomApiCallAction({
            auth: aidbaseAuth,
            baseUrl: () => API_BASE_URL,
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${auth.secret_text}`,
                }
            },
        }),
    ],
    triggers: [
        emailReceived,
        emailStatusChanged,
        emailPriorityChanged,
        emailSent,
        ticketCreated,
        ticketPriorityChanged,
        ticketStatusChanged,
        ticketNewComment,
    ],
})
