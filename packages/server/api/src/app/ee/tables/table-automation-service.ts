import { AgentRun, ApEdition, assertNotNullOrUndefined, isNil, McpToolRequest, PopulatedRecord, Table, TableAutomationTrigger } from "@activepieces/shared"
import { agentRunsService } from "../../agents/agent-runs/agent-runs-service"
import { AgentJobSource } from "@activepieces/server-shared"
import { FastifyBaseLogger } from "fastify"


export const tableAutomationService = (log: FastifyBaseLogger) => ({
    async run(params: RunParams): Promise<AgentRun> {
        /*   if (edition === ApEdition.COMMUNITY) {
               return;
           }*/
        return await agentRunsService(log).run({
            agentId: params.table.agentId,
            projectId: params.projectId,
            prompt: `
            You are a automation agent based on table, the trigger is ${params.trigger}.
            You are given a record from a table with the following data: ${JSON.stringify(params.record.cells)}.
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