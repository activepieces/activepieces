import { FlowRetryStrategy, FlowRunStatus, isFlowRunStateTerminal, isNil, McpServer, McpToolDefinition, Permission } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { formatRunResult, pollForRunCompletion } from './flow-run-utils'
import { mcpToolError } from './mcp-utils'

const retryStrategyValues = Object.values(FlowRetryStrategy) as [FlowRetryStrategy, ...FlowRetryStrategy[]]

const retryRunInput = z.object({
    flowRunId: z.string().describe('The ID of the failed flow run to retry. Use ap_list_runs to find it.'),
    strategy: z.enum(retryStrategyValues).describe('FROM_FAILED_STEP to resume where it failed, ON_LATEST_VERSION to re-run with the current published flow.'),
})

export const apRetryRunTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_retry_run',
        permission: Permission.WRITE_RUN,
        description: 'Retry a failed flow run. Use FROM_FAILED_STEP to resume from the failure point, or ON_LATEST_VERSION to re-run with the current published version. Only works on failed runs.',
        inputSchema: retryRunInput.shape,
        annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowRunId, strategy } = retryRunInput.parse(args)

                const existingRun = await flowRunService(log).getOneOrThrow({ id: flowRunId, projectId: mcp.projectId })

                if (!isFlowRunStateTerminal({ status: existingRun.status, ignoreInternalError: false })) {
                    return { content: [{ type: 'text', text: `❌ Run is ${existingRun.status} — can only retry runs in a terminal state.` }] }
                }

                if (existingRun.status === FlowRunStatus.SUCCEEDED) {
                    return { content: [{ type: 'text', text: '⚠️ Run already succeeded. Use ap_test_flow to run a new test instead.' }] }
                }

                if (strategy === FlowRetryStrategy.ON_LATEST_VERSION) {
                    const flow = await flowService(log).getOneOrThrow({ id: existingRun.flowId, projectId: mcp.projectId })
                    if (isNil(flow.publishedVersionId)) {
                        return { content: [{ type: 'text', text: '❌ Cannot retry with ON_LATEST_VERSION — this flow has not been published yet. Use ap_lock_and_publish first.' }] }
                    }
                }

                const retriedRun = await flowRunService(log).retry({
                    flowRunId,
                    projectId: mcp.projectId,
                    strategy,
                })

                const completedRun = await pollForRunCompletion(log, retriedRun.id, mcp.projectId)

                if (!isFlowRunStateTerminal({ status: completedRun.status, ignoreInternalError: false })) {
                    return {
                        content: [{
                            type: 'text',
                            text: `⏳ Retry still running after 120s. Run ID: ${completedRun.id} (status: ${completedRun.status}). Use ap_get_run to check results later.`,
                        }],
                    }
                }

                return { content: [{ type: 'text', text: formatRunResult(completedRun) }] }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_retry_run failed')
                return mcpToolError('Failed to retry run', err)
            }
        },
    }
}
