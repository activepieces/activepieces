import { AgentRunSource } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { executionDataRetention } from '../../helper/retention/execution-data-retention'
import { AgentConversationEntity } from './agent-conversation-entity'

const conversationRepo = repoFactory(AgentConversationEntity)

export const agentRetention = (log: FastifyBaseLogger) => ({
    async deleteStaleFlowStepConversations(): Promise<void> {
        await executionDataRetention.sweep({
            repo: conversationRepo,
            alias: 'conversation',
            scopeCondition: {
                condition: 'conversation.source = :source',
                parameters: { source: AgentRunSource.FLOW_STEP },
            },
            logLabel: 'agentRetention',
            log,
        })
    },
})
