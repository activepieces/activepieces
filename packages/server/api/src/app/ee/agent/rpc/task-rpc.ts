import { isObject } from '@activepieces/core-utils'
import { BeginAgentTaskRequest, BeginAgentTaskResponse, FinishAgentTaskRequest, SubagentTaskStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentTaskService } from '../agent-task-service'

export const taskRpc = (_log: FastifyBaseLogger) => ({
    async beginAgentTask(input: BeginAgentTaskRequest): Promise<BeginAgentTaskResponse> {
        return agentTaskService.begin(input)
    },

    async finishAgentTask(input: FinishAgentTaskRequest): Promise<void> {
        await agentTaskService.finish({
            ...input,
            status: SubagentTaskStatus[input.status],
            messages: input.messages.filter(isObject),
        })
    },
})
