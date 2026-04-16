import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework'

import { PieceCategory } from '@activepieces/shared'
import actions from './lib/actions'
import { clockodoAuth } from './lib/auth'
import triggers from './lib/triggers'

export const clockodo = createPiece({
    displayName: 'Clockodo',
    description: 'Time tracking made easy',
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/clockodo.png',
    categories: [PieceCategory.PRODUCTIVITY],
    authors: ['JanHolger', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
    auth: clockodoAuth,
    actions,
    triggers,
})
