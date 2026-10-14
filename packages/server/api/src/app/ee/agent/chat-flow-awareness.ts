import { isNil, tryCatch } from '@activepieces/core-utils'
import { FlowSnapshot, FlowStepChange, flowStepDiff, McpToolDefinition, McpToolResult } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { flowService } from '../../flows/flow/flow.service'
import { AgentConversationEntity } from './agent-conversation-entity'

const conversationRepo = repoFactory(AgentConversationEntity)

const STEP_WRITE_TOOLS: Record<string, (args: Record<string, unknown>) => string | null> = {
    ap_update_step: (args) => stringArg(args, 'stepName'),
    ap_delete_step: (args) => stringArg(args, 'stepName'),
    ap_update_trigger: () => 'trigger',
    ap_add_branch: (args) => stringArg(args, 'routerStepName'),
    ap_update_branch: (args) => stringArg(args, 'routerStepName'),
    ap_delete_branch: (args) => stringArg(args, 'routerStepName'),
}

export const chatFlowAwareness = (log: FastifyBaseLogger) => ({
    wrap({ execute, toolTitle, conversationId, projectId }: {
        execute: McpToolDefinition['execute']
        toolTitle: string
        conversationId: string
        projectId: string
    }): McpToolDefinition['execute'] {
        return async (args) => {
            const flowId = stringArg(args, 'flowId')
            const userChanges = isNil(flowId) ? [] : await changesSinceAgentLooked({ conversationId, projectId, flowId, log })
            const targetStep = STEP_WRITE_TOOLS[toolTitle]?.(args) ?? null
            const conflict = userChanges.find((change) => change.stepName === targetStep && change.kind !== 'added')
            if (!isNil(flowId) && !isNil(conflict)) {
                return staleWriteResult({ flowId, changes: userChanges })
            }
            const result = await execute(args)
            const touchedFlowId = flowId ?? structuredFlowId(result)
            if (!isNil(touchedFlowId)) {
                await recordSnapshot({ conversationId, projectId, flowId: touchedFlowId, log })
            }
            if (isNil(flowId) || userChanges.length === 0) {
                return result
            }
            return {
                ...result,
                content: [{ type: 'text', text: `${flowStepDiff.describe({ changes: userChanges, flowId })}\nTreat these edits as what the user wants. Keep them unless the user asks otherwise, and mention them if they change your plan.` }, ...result.content],
            }
        }
    },
})

async function changesSinceAgentLooked({ conversationId, projectId, flowId, log }: {
    conversationId: string
    projectId: string
    flowId: string
    log: FastifyBaseLogger
}): Promise<FlowStepChange[]> {
    const conversation = await conversationRepo().findOne({ where: { id: conversationId, projectId }, select: ['id', 'flowSnapshots'] })
    const before = conversation?.flowSnapshots?.[flowId]
    if (isNil(before)) {
        return []
    }
    const flow = await flowService(log).getOnePopulated({ id: flowId, projectId })
    if (isNil(flow) || flow.version.id === before.versionId && flow.version.updated === before.updated) {
        return []
    }
    return flowStepDiff.diff({ before, after: flowStepDiff.takeSnapshot({ trigger: flow.version.trigger, versionId: flow.version.id }) })
}

async function recordSnapshot({ conversationId, projectId, flowId, log }: {
    conversationId: string
    projectId: string
    flowId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const flow = await flowService(log).getOnePopulated({ id: flowId, projectId })
    if (isNil(flow)) {
        return
    }
    const snapshot: StoredFlowSnapshot = {
        ...flowStepDiff.takeSnapshot({ trigger: flow.version.trigger, versionId: flow.version.id }),
        updated: flow.version.updated,
    }
    const { error } = await tryCatch(() => conversationRepo().createQueryBuilder()
        .update()
        .set({ flowSnapshots: () => 'COALESCE("flowSnapshots", \'{}\'::jsonb) || jsonb_build_object(:flowId::text, :snapshot::jsonb)' })
        .where('id = :conversationId AND "projectId" = :projectId', { conversationId, projectId })
        .setParameters({ flowId, snapshot: JSON.stringify(snapshot) })
        .execute())
    if (error) {
        log.warn({ error, flow: { id: flowId } }, '[chatFlowAwareness] Failed to record the flow snapshot')
    }
}

function staleWriteResult({ flowId, changes }: { flowId: string, changes: FlowStepChange[] }): McpToolResult {
    return {
        isError: true,
        content: [{ type: 'text', text: `❌ Not applied. ${flowStepDiff.describe({ changes, flowId })}\nYou were about to overwrite a step the user just edited. Re-read it (ap_read_step_settings or ap_flow_structure), build on the user's version, then retry. If their edit conflicts with what they asked you, ask them which to keep.` }],
    }
}

function structuredFlowId(result: McpToolResult): string | null {
    const value = result.structuredContent?.['flowId']
    return typeof value === 'string' ? value : null
}

function stringArg(args: Record<string, unknown>, key: string): string | null {
    const value = args[key]
    return typeof value === 'string' && value.length > 0 ? value : null
}

export type StoredFlowSnapshot = FlowSnapshot & {
    updated: string
}
