import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { verifyEmail } from './lib/actions/verify-email'
import { millionVerifierAuth } from './lib/common/auth'

export const millionverifier = createPiece({
    displayName: 'MillionVerifier',
    auth: millionVerifierAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/millionverifier.png',
    authors: ['sanket-a11y'],
    categories: [PieceCategory.COMMUNICATION],
    description: 'MillionVerifier is an email verifier service and API',
    actions: [verifyEmail],
    triggers: [],
})
