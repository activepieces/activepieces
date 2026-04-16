import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createEvent } from './lib/actions/create-event'
import { getAggregation } from './lib/actions/get-aggregation'
import { getSite } from './lib/actions/get-site'
import { listEvents } from './lib/actions/list-events'
import { listSites } from './lib/actions/list-sites'
import { FATHOM_API_BASE, fathomAuth } from './lib/auth'

export const fathomAnalytics = createPiece({
    displayName: 'Fathom Analytics',
    description:
        'Privacy-focused website analytics. Query your site traffic, manage sites and events, and generate custom reports.',
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/fathom-analytics.png',
    categories: [PieceCategory.MARKETING, PieceCategory.BUSINESS_INTELLIGENCE],
    auth: fathomAuth,
    actions: [
        listSites,
        getSite,
        createEvent,
        listEvents,
        getAggregation,
        createCustomApiCallAction({
            auth: fathomAuth,
            baseUrl: () => FATHOM_API_BASE,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.secret_text}`,
            }),
        }),
    ],
    authors: ['Harmatta', 'sanket-a11y'],
    triggers: [],
})
