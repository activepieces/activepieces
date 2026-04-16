import { createPiece } from '@activepieces/pieces-framework'
import { askBotAction } from './lib/actions/ask-bot'
import { tinyTalkAiAuth } from './lib/common/auth'

export const tinyTalkAi = createPiece({
    displayName: 'Tiny Talk AI',
    auth: tinyTalkAiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/tiny-talk-ai.png',
    authors: ['kishanprmr'],
    actions: [askBotAction],
    triggers: [],
})
