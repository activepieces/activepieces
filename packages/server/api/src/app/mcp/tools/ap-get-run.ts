import { isNil, McpToolDefinition, Permission, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { formatRunResult } from './flow-run-utils'
import { mcpUtils } from './mcp-utils'

const getRunInput = z.object({
    flowRunId: z.string().describe('The ID of the flow run. Use ap_list_runs to find it.'),
})

export const apGetRunTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_get_run',
        permission: Permission.READ_RUN,
        description: 'Get detailed results of a flow run including step-by-step outputs, errors, and durations.',
        inputSchema: getRunInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowRunId } = getRunInput.parse(args)

                const run = await flowRunService(log).getOnePopulatedOrThrow({
                    id: flowRunId,
                    projectId: mcp.projectId,
                })

                const stepEntries = !isNil(run.steps) && typeof run.steps === 'object'
                    ? Object.entries(run.steps as Record<string, Record<string, unknown>>)
                    : []

                const structured = {
                    id: run.id,
                    flowId: run.flowId,
                    status: run.status,
                    environment: run.environment,
                    created: run.created,
                    duration: run.startTime && run.finishTime
                        ? `${((new Date(run.finishTime).getTime() - new Date(run.startTime).getTime()) / 1000).toFixed(1)}s`
                        : null,
                    failedStepName: run.failedStep?.name ?? null,
                    steps: stepEntries.map(([name, step]) => ({
                        name,
                        status: String(step.status ?? 'UNKNOWN'),
                        duration: typeof step.duration === 'number' ? step.duration : null,
                        output: step.output ?? null,
                        errorMessage: step.errorMessage ?? null,
                    })),
                }

                return {
                    content: [{
                        type: 'text',
                        text: formatRunResult(run),
                    }],
                    structuredContent: structured,
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_get_run failed')
                return mcpUtils.mcpToolError('Failed to get run', err)
            }
        },
    }
}
