import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { lifestyleNewsSearch } from './lib/actions/lifestyle-news'
import { realTimeWebSearch } from './lib/actions/real-time-data'
import { sportsNewsSearch } from './lib/actions/sports-news'
import { stockMarketDataSearch } from './lib/actions/stock-market-data'

export const dappierAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
    description: 'Enter your Dappier API Key. You can generate one at https://platform.dappier.com/profile/api-keys.',
})

export const dappier = createPiece({
    displayName: 'Dappier',
    logoUrl: 'https://cdn.activepieces.com/pieces/dappier.png',
    description:
        'Enable fast, free real-time web search and access premium data from trusted media brands—news, financial markets, sports, entertainment, weather, and more. Build powerful AI agents with Dappier',
    auth: dappierAuth,
    authors: [],
    actions: [realTimeWebSearch, stockMarketDataSearch, sportsNewsSearch, lifestyleNewsSearch],
    triggers: [],
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.BUSINESS_INTELLIGENCE],
})
