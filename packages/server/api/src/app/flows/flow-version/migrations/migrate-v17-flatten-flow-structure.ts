import {
    FlowAction,
    FlowActionType,
    FlowVersion,
} from '@activepieces/shared'
import { Migration } from '.'

export const migrateV17FlattenFlowStructure: Migration = {
    targetSchemaVersion: '16',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const allActions: FlowAction[] = []
        const oldTrigger = flowVersion.trigger as unknown as LegacyStep

        const triggerStepNames = collectChain(oldTrigger.nextAction, allActions)

        const newTrigger = {
            name: oldTrigger.name,
            type: oldTrigger.type,
            displayName: oldTrigger.displayName,
            valid: oldTrigger.valid,
            settings: oldTrigger.settings,
            steps: triggerStepNames,
        }

        return {
            ...flowVersion,
            trigger: newTrigger as unknown as FlowVersion['trigger'],
            steps: allActions,
            schemaVersion: '17',
        }
    },
}

function collectChain(firstStep: LegacyStep | null | undefined, allActions: FlowAction[]): string[] {
    const stepNames: string[] = []
    let current = firstStep
    while (current) {
        stepNames.push(current.name)
        const index = allActions.length
        allActions.push(undefined as unknown as FlowAction)
        const flatAction = flattenAction(current, allActions)
        allActions[index] = flatAction
        current = current.nextAction
    }
    return stepNames
}

function flattenAction(oldStep: LegacyStep, allActions: FlowAction[]): FlowAction {
    if (oldStep.type === FlowActionType.ROUTER) {
        return flattenRouter(oldStep, allActions)
    }

    if (oldStep.type === FlowActionType.LOOP_ON_ITEMS) {
        return flattenLoop(oldStep, allActions)
    }

    return {
        name: oldStep.name,
        type: oldStep.type,
        displayName: oldStep.displayName,
        valid: oldStep.valid,
        skip: oldStep.skip,
        settings: oldStep.settings,
    } as FlowAction
}

function flattenRouter(oldStep: LegacyStep, allActions: FlowAction[]): FlowAction {
    const oldBranches = (oldStep.settings?.branches ?? []) as LegacyBranch[]
    const oldChildren = oldStep.children ?? []

    const branches = oldBranches.map((branch, i) => {
        const child = oldChildren[i] ?? null
        const childStepNames = collectChain(child, allActions)
        return { ...branch, steps: childStepNames }
    })

    const settings = { ...oldStep.settings }
    delete settings.branches

    return {
        name: oldStep.name,
        type: FlowActionType.ROUTER,
        displayName: oldStep.displayName,
        valid: oldStep.valid,
        skip: oldStep.skip,
        settings,
        branches,
    } as FlowAction
}

function flattenLoop(oldStep: LegacyStep, allActions: FlowAction[]): FlowAction {
    const loopStepNames = collectChain(oldStep.firstLoopAction, allActions)

    return {
        name: oldStep.name,
        type: FlowActionType.LOOP_ON_ITEMS,
        displayName: oldStep.displayName,
        valid: oldStep.valid,
        skip: oldStep.skip,
        settings: oldStep.settings,
        children: loopStepNames,
    } as FlowAction
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

type LegacyBranch = {
    branchName: string
    branchType: string
    conditions?: unknown
}
