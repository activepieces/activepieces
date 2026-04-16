import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { markAsRead } from './lib/actions/mark-as-read'
import { requestLocation } from './lib/actions/request-location'
import { sendAudio } from './lib/actions/send-audio'
import { sendButtons } from './lib/actions/send-buttons'
import { sendContact } from './lib/actions/send-contact'
import { sendDocument } from './lib/actions/send-document'
import { sendImage } from './lib/actions/send-image'
import { sendList } from './lib/actions/send-list'
import { sendLocation } from './lib/actions/send-location'
import { sendReaction } from './lib/actions/send-reaction'
import { sendSticker } from './lib/actions/send-sticker'
import { sendTemplate } from './lib/actions/send-template'
import { sendTextMessage } from './lib/actions/send-text-message'
import { sendVideo } from './lib/actions/send-video'
import { KAPSO_BASE_URL, kapsoAuth } from './lib/common'
import { messageStatusUpdate } from './lib/triggers/message-status-update'
import { newMessage } from './lib/triggers/new-message'

export const kapso = createPiece({
    displayName: 'Kapso',
    description: 'Send and receive WhatsApp messages, media, templates, and more using the Kapso WhatsApp API.',
    auth: kapsoAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/kapso.png',
    categories: [PieceCategory.COMMUNICATION],
    authors: ['onyedikachi-david'],
    actions: [
        sendTextMessage,
        sendButtons,
        sendList,
        sendImage,
        sendVideo,
        sendAudio,
        sendDocument,
        sendSticker,
        sendLocation,
        requestLocation,
        sendContact,
        sendReaction,
        markAsRead,
        sendTemplate,
        createCustomApiCallAction({
            auth: kapsoAuth,
            baseUrl: () => KAPSO_BASE_URL,
            authMapping: async (auth) => {
                return {
                    'X-API-Key': auth.secret_text,
                }
            },
        }),
    ],
    triggers: [newMessage, messageStatusUpdate],
})
