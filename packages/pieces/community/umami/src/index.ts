import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { getActiveVisitors } from './lib/actions/get-active-visitors'
import { getPageviews } from './lib/actions/get-pageviews'
import { getWebsiteMetrics } from './lib/actions/get-website-metrics'
import { getWebsiteStats } from './lib/actions/get-website-stats'
import { listWebsites } from './lib/actions/list-websites'
import { sendEvent } from './lib/actions/send-event'
import { getAuthHeaders, getBaseUrl, UmamiAuthValue, umamiAuth } from './lib/auth'
import { newEvent } from './lib/triggers/new-event'
import { newSession } from './lib/triggers/new-session'

export const umami = createPiece({
    displayName: 'Umami',
    description: 'Privacy-focused, open-source web analytics.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/umami.png',
    categories: [PieceCategory.BUSINESS_INTELLIGENCE],
    auth: umamiAuth,
    authors: ['bst1n'],
    actions: [
        getWebsiteStats,
        getWebsiteMetrics,
        getActiveVisitors,
        getPageviews,
        sendEvent,
        listWebsites,
        createCustomApiCallAction({
            auth: umamiAuth,
            baseUrl: (auth) => (auth ? getBaseUrl(auth as UmamiAuthValue) : 'https://api.umami.is/v1'),
            authMapping: async (auth) => getAuthHeaders(auth as UmamiAuthValue),
        }),
    ],
    triggers: [newEvent, newSession],
})
