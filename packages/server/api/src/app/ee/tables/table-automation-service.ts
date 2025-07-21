import { AgentJobSource } from '@activepieces/server-shared'
import { ApEdition, assertNotNullOrUndefined, isNil, McpToolRequest, PopulatedRecord, Table, TableAutomationTrigger } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentRunsService } from '../../agents/agent-runs/agent-runs-service'
import { system } from '../../helper/system/system'

const edition = system.getEdition()

export const tableAutomationService = (log: FastifyBaseLogger) => ({
    async run(params: RunParams): Promise<void> {
        /*   if (edition === ApEdition.COMMUNITY) {
            return;
        }*/
        if (params.table.trigger !== params.trigger) {
            return
        }
        console.log('RUN AUTOMATION')

        await agentRunsService(log).run({
            agentId: params.table.agentId,
            projectId: params.projectId,
            // TODO IMPROVE PROMPT
            prompt: `
            You are a table automation agent.
            You are given a record from a table.
            You need to update the record based on the table automation.
            `,
            source: AgentJobSource.TABLE,
            recordId: params.record.id,
            tableId: params.record.tableId,
        })
    },
})

type RunParams = {
    table: Table
    record: PopulatedRecord
    projectId: string
    trigger: TableAutomationTrigger
}