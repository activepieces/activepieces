import { AuthenticationType, createCustomApiCallAction, HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { crawlWebsite, extractDocument, generateImage, scrapeWebsite, searchNews, webSearch } from './lib/actions'
import { dumplingAuth } from './lib/auth'

export const dumplingAi = createPiece({
    displayName: 'Dumpling AI',
    description: 'Transform unstructured website content into clean, AI-ready data',
    auth: dumplingAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/dumpling-ai.png',
    authors: ['neo773'],
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
    actions: [
        webSearch,
        searchNews,
        generateImage,
        scrapeWebsite,
        crawlWebsite,
        extractDocument,
        createCustomApiCallAction({
            baseUrl: () => 'https://app.dumplingai.com/api/v1',
            auth: dumplingAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth}`,
            }),
        }),
    ],
    triggers: [],
})
