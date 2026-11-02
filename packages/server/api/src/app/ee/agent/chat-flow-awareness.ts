import { isNil, tryCatch } from '@activepieces/core-utils'
import { FlowSnapshot, FlowStepChange, flowStepDiff, flowStructureUtil, FlowToolTarget, flowToolTargets, McpToolDefinition, McpToolResult, PopulatedFlow } from '@activepieces/shared'
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
            const target = flowToolTargets.targetOf({ toolName: toolTitle, input: args })
            const before = isNil(flowId) ? null : await loadFlowState({ conversationId, projectId, flowId, log })
            const userChanges = isNil(before) || isNil(before.stored) ? [] : flowStepDiff.diff({ before: before.stored, after: before.current })
            const conflict = isNil(before) ? undefined : findConflict({ userChanges, target, flow: before.flow, branchIndex: numberArg({ args, key: 'branchIndex' }) })
            if (!isNil(flowId) && !isNil(conflict)) {
                return staleWriteResult({ flowId, changes: userChanges })
            }
            const result = await execute(args)
            const touchedFlowId = flowId ?? structuredFlowId(result)
            if (!isNil(touchedFlowId)) {
                const snapshot = await nextSnapshot({ before: touchedFlowId === flowId ? before : null, target, userChanges, projectId, flowId: touchedFlowId, log })
                await recordSnapshot({ conversationId, projectId, flowId: touchedFlowId, snapshot, log })
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

async function loadFlowState({ conversationId, projectId, flowId, log }: {
    conversationId: string
    projectId: string
    flowId: string
    log: FastifyBaseLogger
}): Promise<FlowState | null> {
    const [conversation, flow] = await Promise.all([
        conversationRepo().findOne({ where: { id: conversationId, projectId }, select: ['id', 'flowSnapshots'] }),
        flowService(log).getOnePopulated({ id: flowId, projectId }),
    ])
    if (isNil(flow)) {
        return null
    }
    return {
        flow,
        stored: conversation?.flowSnapshots?.[flowId] ?? null,
        current: snapshotOf(flow),
    }
}

function findConflict({ userChanges, target, flow, branchIndex }: {
    userChanges: FlowStepChange[]
    target: FlowToolTarget | null
    flow: PopulatedFlow
    branchIndex: number | null
}): FlowStepChange | undefined {
    if (isNil(target) || !('stepName' in target) || !WRITE_KINDS.has(target.kind)) {
        return undefined
    }
    const guardedSteps = target.kind === 'removing'
        ? removedSteps({ flow, stepName: target.stepName, branchIndex })
        : [target.stepName]
    return userChanges.find((change) => guardedSteps.includes(change.stepName) && change.kind !== 'added')
}

function removedSteps({ flow, stepName, branchIndex }: { flow: PopulatedFlow, stepName: string, branchIndex: number | null }): string[] {
    const step = flowStructureUtil.getStep(stepName, flow.version.trigger)
    if (isNil(step)) {
        return [stepName]
    }
    if (isNil(branchIndex)) {
        return flowStructureUtil.getAllChildSteps(step).map((child) => child.name)
    }
    const branchStart = 'children' in step ? step.children[branchIndex] : null
    const branchSteps = isNil(branchStart) ? [] : flowStructureUtil.getAllSteps(branchStart).map((child) => child.name)
    return [stepName, ...branchSteps]
}

async function nextSnapshot({ before, target, userChanges, projectId, flowId, log }: {
    before: FlowState | null
    target: FlowToolTarget | null
    userChanges: FlowStepChange[]
    projectId: string
    flowId: string
    log: FastifyBaseLogger
}): Promise<FlowSnapshot | null> {
    const wroteSteps = isNil(before) || (!isNil(target) && WRITE_KINDS.has(target.kind))
    const base = wroteSteps ? await currentSnapshot({ projectId, flowId, log }) : before.current
    if (isNil(base) || isNil(before) || isNil(before.stored)) {
        return base
    }
    const stored = before.stored
    const unreadSteps = userChanges
        .filter((change) => change.kind === 'changed' && change.stepName in base.steps && !readsStep({ target, stepName: change.stepName }))
        .map((change) => [change.stepName, stored.steps[change.stepName]])
    return { ...base, steps: { ...base.steps, ...Object.fromEntries(unreadSteps) } }
}

function readsStep({ target, stepName }: { target: FlowToolTarget | null, stepName: string }): boolean {
    if (isNil(target)) {
        return false
    }
    if (target.kind === 'reading-flow') {
        return true
    }
    return target.kind === 'reading' && target.stepName === stepName
}

async function currentSnapshot({ projectId, flowId, log }: { projectId: string, flowId: string, log: FastifyBaseLogger }): Promise<FlowSnapshot | null> {
    const flow = await flowService(log).getOnePopulated({ id: flowId, projectId })
    return isNil(flow) ? null : snapshotOf(flow)
}

function snapshotOf(flow: PopulatedFlow): FlowSnapshot {
    return flowStepDiff.takeSnapshot({ trigger: flow.version.trigger, versionId: flow.version.id })
}

async function recordSnapshot({ conversationId, projectId, flowId, snapshot, log }: {
    conversationId: string
    projectId: string
    flowId: string
    snapshot: FlowSnapshot | null
    log: FastifyBaseLogger
}): Promise<void> {
    if (isNil(snapshot)) {
        return
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

function numberArg({ args, key }: { args: Record<string, unknown>, key: string }): number | null {
    const value = args[key]
    return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function stringArg({ args, key }: { args: Record<string, unknown>, key: string }): string | null {
    const value = args[key]
    return typeof value === 'string' && value.length > 0 ? value : null
}

const WRITE_KINDS = new Set<FlowToolTarget['kind']>(['editing', 'removing', 'adding-after'])

type FlowState = {
    flow: PopulatedFlow
    stored: FlowSnapshot | null
    current: FlowSnapshot
}
