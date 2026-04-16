import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { detectTextAction } from './lib/actions/detect-text'
import { humanizeTextAction } from './lib/actions/humanize-text'
import { hastewireAuth } from './lib/common/auth'

export const hastewire = createPiece({
    displayName: 'Hastewire',
    auth: hastewireAuth,
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/hastewire.png',
    authors: ['kishanprmr'],
    actions: [detectTextAction, humanizeTextAction],
    triggers: [],
})
