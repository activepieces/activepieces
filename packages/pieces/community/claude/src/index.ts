import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { extractStructuredDataAction } from './lib/actions/extract-structured-data'
import { askClaude } from './lib/actions/send-prompt'
import { claudeAuth } from './lib/auth'
import { baseUrl } from './lib/common/common'

export const claude = createPiece({
    displayName: 'Anthropic Claude',
    auth: claudeAuth,
    minimumSupportedRelease: '0.63.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['dennisrongo', 'kishanprmr'],
    actions: [
        askClaude,
        extractStructuredDataAction,
        createCustomApiCallAction({
            auth: claudeAuth,
            baseUrl: () => baseUrl,
            authMapping: async (auth) => {
                return {
                    'x-api-key': `${auth.secret_text}`,
                }
            },
        }),
    ],
    triggers: [],
})
