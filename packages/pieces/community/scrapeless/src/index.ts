import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { crawlCrawlApi } from './lib/actions/crawl-crawl'
import { crawlScrapeApi } from './lib/actions/crawl-scrape'
import { googleSearchApi } from './lib/actions/google-search-api'
import { googleTrendsApi } from './lib/actions/google-trends-api'
import { universalScrapingApi } from './lib/actions/universal-scraping-api'
import { scrapelessApiAuth } from './lib/auth'
import { ScrapelessValidator } from './lib/utils/validator'

export const scrapeless = createPiece({
    displayName: 'Scrapeless',
    description: 'Scrapeless is an all-in-one and highly scalable web scraping toolkit for enterprises and developers.',
    auth: scrapelessApiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/scrapeless.png',
    categories: [PieceCategory.PRODUCTIVITY],
    authors: ['sunorains'],
    actions: [
        googleSearchApi,
        crawlScrapeApi,
        crawlCrawlApi,
        googleTrendsApi,
        universalScrapingApi,
        createCustomApiCallAction({
            auth: scrapelessApiAuth,
            baseUrl: () => 'https://api.scrapeless.com/api/v1',
            authMapping: async (auth) => {
                return {
                    'x-api-token': auth.secret_text,
                }
            },
        }),
    ],
    triggers: [],
})
