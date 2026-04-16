import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { callFlow } from './lib/actions/call-flow'
import { response } from './lib/actions/respond'
import { callableFlow } from './lib/triggers/callable-flow'

export const flows = createPiece({
    displayName: 'Sub Flows',
    description: 'Trigger and call another sub flow.',
    auth: PieceAuth.None(),
    minimumSupportedRelease: '0.67.1',
    categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
    logoUrl: 'https://cdn.activepieces.com/pieces/new-core/subflows.svg',
    authors: ['hazemadelkhalel'],
    actions: [callFlow, response],
    triggers: [callableFlow],
})
