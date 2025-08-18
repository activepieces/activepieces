import { AgentJobSource } from '@activepieces/server-shared'
import { AgentRun, PopulatedRecord, TableAutomationTrigger } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentRunsService } from '../../agents/agent-runs/agent-runs-service'


export const tableAutomationService = (log: FastifyBaseLogger) => ({
    async run(params: RunParams): Promise<AgentRun> {
        return agentRunsService(log).run({
            agentId: params.agentId,
            projectId: params.projectId,
            prompt: `
            You are a automation agent based on table, the trigger is ${params.trigger}.
            `,
            source: AgentJobSource.TABLE,
            recordId: params.record.id,
            tableId: params.tableId,
        })
    },
})

type RunParams = {
    agentId: string
    tableId: string
    record: PopulatedRecord
    projectId: string
    trigger: TableAutomationTrigger
}