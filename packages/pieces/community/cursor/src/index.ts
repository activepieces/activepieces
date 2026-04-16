import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addFollowupInstruction } from './lib/actions/add-followup-instruction'
import { deleteAgent } from './lib/actions/delete-agent'
import { findAgentStatus } from './lib/actions/find-agent-status'
import { launchAgent } from './lib/actions/launch-agent'
import { cursorAuth } from './lib/common/auth'
import { agentPullRequestCreatedTrigger } from './lib/triggers/agent-pull-request-created'
import { agentStatusChangedWebhookTrigger } from './lib/triggers/agent-status-changed-webhook'
import { agentStatusEqualsTrigger } from './lib/triggers/agent-status-equals'
import { newAgentTrigger } from './lib/triggers/new-agent'
import { newAgentConversationMessageTrigger } from './lib/triggers/new-agent-conversation-message'

export const cursor = createPiece({
    displayName: 'Cursor',
    description:
        'AI-powered code editor with cloud agents that can work on your repositories. Launch agents, monitor their status, and automate code-related tasks.',
    auth: cursorAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/cursor.png',
    categories: [PieceCategory.DEVELOPER_TOOLS],
    authors: ['onyedikachi-david'],
    actions: [launchAgent, addFollowupInstruction, findAgentStatus, deleteAgent],
    triggers: [
        newAgentTrigger,
        agentStatusEqualsTrigger,
        agentPullRequestCreatedTrigger,
        newAgentConversationMessageTrigger,
        agentStatusChangedWebhookTrigger,
    ],
})
