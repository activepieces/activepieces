import { isNil, tryCatch } from '@activepieces/core-utils'
import { FlowSnapshot, FlowStepChange, flowStepDiff, flowToolTargets, McpToolDefinition, McpToolResult, PopulatedFlow } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { flowService } from '../../flows/flow/flow.service'
import { AgentConversationEntity } from './agent-conversation-entity'

const conversationRepo = repoFactory(AgentConversationEntity)

export const chatFlowAwareness = (log: FastifyBaseLogger) => ({
    wrap({ execute, toolTitle, conversationId, projectId }: {
        execute: McpToolDefinition['execute']
        toolTitle: string
        conversationId: string
        projectId: string
    }): McpToolDefinition['execute'] {
        return async (args) => {
            const flowId = stringArg({ args, key: 'flowId' })
            const stored = isNil(flowId) ? null : await storedSnapshot({ conversationId, projectId, flowId })
            const userChanges = isNil(flowId) || isNil(stored) ? [] : await changesSince({ stored, projectId, flowId, log })
            const target = flowToolTargets.targetOf({ toolName: toolTitle, input: args })
            const targetStep = target?.kind === 'editing' ? target.stepName : null
            const conflict = userChanges.find((change) => change.stepName === targetStep && change.kind !== 'added')
            if (!isNil(flowId) && !isNil(conflict)) {
                return staleWriteResult({ flowId, changes: userChanges })
            }
            const result = await execute(args)
            const touchedFlowId = flowId ?? structuredFlowId(result)
            if (!isNil(touchedFlowId)) {
                await recordSnapshot({ conversationId, projectId, flowId: touchedFlowId, stored: touchedFlowId === flowId ? stored : null, log })
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

async function storedSnapshot({ conversationId, projectId, flowId }: {
    conversationId: string
    projectId: string
    flowId: string
}): Promise<StoredFlowSnapshot | null> {
    const conversation = await conversationRepo().findOne({ where: { id: conversationId, projectId }, select: ['id', 'flowSnapshots'] })
    return conversation?.flowSnapshots?.[flowId] ?? null
}

async function changesSince({ stored, projectId, flowId, log }: {
    stored: StoredFlowSnapshot
    projectId: string
    flowId: string
    log: FastifyBaseLogger
}): Promise<FlowStepChange[]> {
    const flow = await flowService(log).getOnePopulated({ id: flowId, projectId })
    if (isNil(flow) || isSameVersion({ stored, flow })) {
        return []
    }
    return flowStepDiff.diff({ before: stored, after: flowStepDiff.takeSnapshot({ trigger: flow.version.trigger, versionId: flow.version.id }) })
}

async function recordSnapshot({ conversationId, projectId, flowId, stored, log }: {
    conversationId: string
    projectId: string
    flowId: string
    stored: StoredFlowSnapshot | null
    log: FastifyBaseLogger
}): Promise<void> {
    const flow = await flowService(log).getOnePopulated({ id: flowId, projectId })
    if (isNil(flow) || (!isNil(stored) && isSameVersion({ stored, flow }))) {
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

function isSameVersion({ stored, flow }: { stored: StoredFlowSnapshot, flow: PopulatedFlow }): boolean {
    return flow.version.id === stored.versionId && flow.version.updated === stored.updated
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

function stringArg({ args, key }: { args: Record<string, unknown>, key: string }): string | null {
    const value = args[key]
    return typeof value === 'string' && value.length > 0 ? value : null
}

export type StoredFlowSnapshot = FlowSnapshot & {
    updated: string
}
