import { createCustomApiCallAction, HttpMethod } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { answerAction } from './lib/actions/answer'
import { createBatchAction } from './lib/actions/create-batch'
import { createDeepResearchTaskAction } from './lib/actions/create-deep-research-task'
import { extractContentAction } from './lib/actions/extract-content'
import { listDatasourcesAction } from './lib/actions/list-datasources'
import { searchAction } from './lib/actions/search'
import { valyuAuth } from './lib/auth'
import { makeRequest } from './lib/common'

export const valyu = createPiece({
    displayName: 'Valyu',
    description: 'Search the web, research papers, and proprietary datasets with intelligent query processing.',
    auth: valyuAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/valyu.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
    authors: ['onyedikachi-david'],
    actions: [
        searchAction,
        extractContentAction,
        answerAction,
        createDeepResearchTaskAction,
        createBatchAction,
        listDatasourcesAction,
        createCustomApiCallAction({
            auth: valyuAuth,
            baseUrl: () => 'https://api.valyu.ai',
            authMapping: async (auth) => ({
                'x-api-key': `${auth}`,
            }),
        }),
    ],
    triggers: [],
})
