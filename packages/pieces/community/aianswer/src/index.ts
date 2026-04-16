import { createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createPhoneCall } from './lib/actions/create-phone-call'
import { getCallDetails } from './lib/actions/get-call-details'
import { getCallTranscript } from './lib/actions/get-call-transcript'
import { gmailGetListOfAgents } from './lib/actions/gmail-get-list-of-agents'
import { scheduleCallAgent } from './lib/actions/schedule-call-agent'
import { aiAnswerAuth } from './lib/auth'
import { aiAnswerConfig } from './lib/common/models'

export const aianswer = createPiece({
    displayName: 'AI Answer',
    auth: aiAnswerAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/aianswer.png',
    categories: [PieceCategory.COMMUNICATION, PieceCategory.CUSTOMER_SUPPORT, PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['drona2938'],
    actions: [
        gmailGetListOfAgents,
        createPhoneCall,
        getCallDetails,
        scheduleCallAgent,
        getCallTranscript,
        createCustomApiCallAction({
            baseUrl: () => aiAnswerConfig.baseUrl,
            auth: aiAnswerAuth,
            authMapping: async (auth) => ({
                [aiAnswerConfig.accessTokenHeaderKey]: `${auth.secret_text}`,
            }),
        }),
    ],
    triggers: [],
})
