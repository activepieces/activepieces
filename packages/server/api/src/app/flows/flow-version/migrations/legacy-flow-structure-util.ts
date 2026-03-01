import { FlowActionKind, FlowVersion } from '@activepieces/shared'

/**
 * Legacy flow structure utilities for pre-v17 migrations.
 * These functions work with the old linked-list flow format where:
 * - Trigger has `nextAction` pointing to the first action
 * - Each action has `nextAction` pointing to the next sibling
 * - RouterAction has `children: (FlowAction | null)[]` for branch bodies
 * - LoopOnItemsAction has `firstLoopAction` for the loop body
 *
 * After v17 migration, flows use a graph model and these utilities
 * are no longer needed.
 */

function getAllSteps(flowVersion: FlowVersion): LegacyStep[] {
    const steps: LegacyStep[] = []
    const legacyFV = flowVersion as unknown as LegacyFlowVersion
    collectSteps(legacyFV.trigger, steps)
    return steps
}

function collectSteps(step: LegacyStep | null | undefined, result: LegacyStep[]): void {
    if (!step) return
    result.push(step)
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
    transferFunction: (step: LegacyStep) => LegacyStep,
): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    const legacyCloned = cloned as unknown as LegacyFlowVersion
    legacyCloned.trigger = transferStep(legacyCloned.trigger, transferFunction) as LegacyStep
    return cloned
}

function transferStep(
    step: LegacyStep | null | undefined,
    fn: (step: LegacyStep) => LegacyStep,
): LegacyStep | null | undefined {
    if (!step) return step
    const transformed = fn(step)
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
    const legacyFV = flowVersion as unknown as LegacyFlowVersion
    const triggerAuthIds = legacyFV.trigger?.settings?.input?.auth
        ? extractConnectionIdsFromAuth(legacyFV.trigger.settings.input.auth as string)
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

function getExternalAgentId(action: LegacyStep): string | null {
    if (isAgentPiece(action) && action.settings.input && 'agentId' in action.settings.input) {
        return action.settings.input.agentId as string
    }
    return null
}

function isAgentPiece(action: LegacyStep): boolean {
    return (
        action.type === FlowActionKind.PIECE && action.settings.pieceName === '@activepieces/piece-ai'
    )
}

export const legacyFlowStructureUtil = {
    getAllSteps,
    transferFlow,
    extractConnectionIds,
    extractAgentIds,
}

export type LegacyStepSettings = {
    pieceName: string
    pieceVersion: string
    actionName: string
    triggerName: string
    input: Record<string, unknown>
    propertySettings: Record<string, unknown>
    [key: string]: unknown
}

export type LegacyStep = {
    name: string
    type: string
    displayName: string
    valid: boolean
    settings: LegacyStepSettings
    skip?: boolean
    customLogoUrl?: string
    nextAction?: LegacyStep
    onSuccessAction?: LegacyStep | null
    onFailureAction?: LegacyStep | null
    children?: (LegacyStep | null)[]
    firstLoopAction?: LegacyStep
}

type LegacyFlowVersion = {
    trigger: LegacyStep
}
