import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { getNoteAction } from './lib/actions/get-note'
import { fellowAuth, getBaseUrl } from './lib/common/auth'
import { newRecordingTrigger } from './lib/triggers/new-recording'

export const fellow = createPiece({
    displayName: 'Fellow.ai',
    description: 'AI Meeting Assistant and Notetaker',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
    auth: fellowAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/fellow.png',
    authors: ['kishanprmr'],
    actions: [
        getNoteAction,
        createCustomApiCallAction({
            auth: fellowAuth,
            baseUrl: (auth) => {
                return getBaseUrl(auth?.props.subdomain ?? '')
            },
            authMapping: async (auth) => {
                return {
                    'X-API-KEY': `${auth.props.apiKey}`,
                }
            },
        }),
    ],
    triggers: [newRecordingTrigger],
})
