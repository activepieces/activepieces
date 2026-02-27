import { FlowActionType, FlowVersion, FlowTrigger, FlowAction, Step } from '@activepieces/shared'

/**
 * Legacy flow structure utilities for pre-v17 migrations.
 * These functions work with the old linked-list flow format where:
 * - Trigger has `nextAction` pointing to the first action
 * - Each action has `nextAction` pointing to the next sibling
 * - RouterAction has `children: (FlowAction | null)[]` for branch bodies
 * - LoopOnItemsAction has `firstLoopAction` for the loop body
 *
 * After v17 migration, flows use a flat-array model and these utilities
 * are no longer needed.
 */

function getAllSteps(flowVersion: FlowVersion): Step[] {
    const steps: Step[] = []
    const trigger = flowVersion.trigger as unknown as LegacyTrigger
    collectSteps(trigger, steps)
    return steps
}

function collectSteps(step: LegacyStep | null | undefined, result: Step[]): void {
    if (!step) return
    result.push(step as unknown as Step)
    if (step.nextAction) {
        collectSteps(step.nextAction, result)
    }
    if (step.children) {
        for (const child of step.children) {
            collectSteps(child, result)
        }
    }
    if (step.firstLoopAction) {
        collectSteps(step.firstLoopAction, result)
    }
}

function transferFlow(
    flowVersion: FlowVersion,
    transferFunction: (step: Step) => Step,
): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    const trigger = cloned.trigger as unknown as LegacyStep
    cloned.trigger = transferStep(trigger, transferFunction) as unknown as FlowTrigger
    return cloned
}

function transferStep(
    step: LegacyStep | null | undefined,
    fn: (step: Step) => Step,
): LegacyStep | null | undefined {
    if (!step) return step
    const transformed = fn(step as unknown as Step) as unknown as LegacyStep
    if (transformed.nextAction) {
        transformed.nextAction = transferStep(transformed.nextAction, fn) as LegacyStep
    }
    if (transformed.children) {
        transformed.children = transformed.children.map(child =>
            child ? transferStep(child, fn) as LegacyStep : null,
        )
    }
    if (transformed.firstLoopAction) {
        transformed.firstLoopAction = transferStep(transformed.firstLoopAction, fn) as LegacyStep
    }
    return transformed
}

function extractConnectionIds(flowVersion: FlowVersion): string[] {
    const trigger = flowVersion.trigger as unknown as LegacyTrigger
    const triggerAuthIds = trigger.settings?.input?.auth
        ? extractConnectionIdsFromAuth(trigger.settings.input.auth as string)
        : []

    const stepAuthIds = getAllSteps(flowVersion)
        .flatMap(step =>
            step.settings?.input?.auth
                ? extractConnectionIdsFromAuth(step.settings.input.auth as string)
                : [],
        )

    return Array.from(new Set([...triggerAuthIds, ...stepAuthIds]))
}

function extractConnectionIdsFromAuth(auth: string): string[] {
    const match = auth.match(/{{connections\['([^']*(?:'\s*,\s*'[^']*)*)'\]}}/)
    if (!match || !match[1]) {
        return []
    }
    return match[1].split(/'\s*,\s*'/).map(id => id.trim())
}

function extractAgentIds(flowVersion: FlowVersion): string[] {
    return getAllSteps(flowVersion).map(step => getExternalAgentId(step)).filter((step): step is string => step !== null && step !== '')
}

function getExternalAgentId(action: Step): string | null {
    if (isAgentPiece(action) && 'agentId' in action.settings.input) {
        return action.settings.input.agentId as string
    }
    return null
}

function isAgentPiece(action: Step): boolean {
    return (
        action.type === FlowActionType.PIECE && action.settings.pieceName === '@activepieces/piece-ai'
    )
}

export const legacyFlowStructureUtil = {
    getAllSteps,
    transferFlow,
    extractConnectionIds,
    extractAgentIds,
}

type LegacyStep = {
    name: string
    type: string
    displayName: string
    valid: boolean
    settings: Record<string, unknown>
    skip?: boolean
    nextAction?: LegacyStep
    children?: (LegacyStep | null)[]
    firstLoopAction?: LegacyStep
}

type LegacyTrigger = LegacyStep & {
    settings: {
        input?: {
            auth?: string
        }
    }
}
