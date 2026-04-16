import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createCall } from './lib/actions/create-call'
import { getCall } from './lib/actions/get-call'
import { updateAssistant } from './lib/actions/update-assistant'
import { VAPI_BASE_URL, vapiAuth } from './lib/auth'

export const vapi = createPiece({
    displayName: 'Vapi',
    description: 'AI voice agent platform. Create outbound calls, manage assistants, and retrieve call details.',
    auth: vapiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/vapi.png',
    categories: [PieceCategory.COMMUNICATION],
    authors: ['Harmatta'],
    actions: [
        createCall,
        getCall,
        updateAssistant,
        createCustomApiCallAction({
            baseUrl: () => VAPI_BASE_URL,
            auth: vapiAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [],
})
