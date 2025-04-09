import { PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { returnResponse } from './lib/actions/return-response'
import { onChatSubmission } from './lib/triggers/chat-trigger'
import { onFormSubmission } from './lib/triggers/form-trigger'

export const forms = createPiece({
  displayName: 'Human Input',
  description: 'Trigger a flow through human input.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.37.6',
  categories: [PieceCategory.CORE],
  logoUrl: 'https://cdn.activepieces.com/pieces/human-input.svg',
  authors: ['anasbarg', 'MoShizzle', 'abuaboud'],
  actions: [returnResponse],
  triggers: [onFormSubmission, onChatSubmission],
})
