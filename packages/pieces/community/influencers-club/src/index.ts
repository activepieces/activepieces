import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { enrichCreatorByEmail } from './lib/actions/enrich-creator-by-email'
import { enrichCreatorByHandle } from './lib/actions/enrich-creator-by-handle'
import { findSimilarCreator } from './lib/actions/find-similar-creator'
import { influencersClubAuth } from './lib/common/auth'

export const influencersClub = createPiece({
    displayName: 'Influencers.club',
    auth: influencersClubAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/influencers-club.png',
    categories: [PieceCategory.MARKETING],
    authors: ['sanket-a11y'],
    description: 'Connect to Influencers.club to enrich and find influencers for your marketing campaigns.',
    actions: [
        enrichCreatorByEmail,
        enrichCreatorByHandle,
        findSimilarCreator,
        createCustomApiCallAction({
            auth: influencersClubAuth,
            baseUrl: () => `https://api-dashboard.influencers.club/public/v1`,
            authMapping: async (auth) => {
                return { Authorization: `Bearer ${auth.secret_text}` }
            },
        }),
    ],
    triggers: [],
})
