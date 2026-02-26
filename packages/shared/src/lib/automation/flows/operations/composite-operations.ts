import { BranchExecutionType, FlowAction, FlowActionType, LoopOnItemsAction, RouterAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { FlowTrigger } from '../triggers/trigger'
import { flowStructureUtil } from '../util/flow-structure-util'
import { actionUtils } from './action-operations'
import { FlowOperationRequest, FlowOperationType, ImportFlowRequest, MoveActionRequest, StepLocationRelativeToParent } from './index'

// --- Move Action ---

function moveAction(flowVersion: FlowVersion, request: MoveActionRequest): FlowOperationRequest[] {
    const action = flowStructureUtil.getActionOrThrow(request.name, flowVersion)
    flowStructureUtil.getStepOrThrow(request.newParentStep, flowVersion)

    return [
        {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: [request.name] },
        },
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                action,
                parentStep: request.newParentStep,
                stepLocationRelativeToParent: request.stepLocationRelativeToNewParent,
                branchIndex: request.branchIndex,
            },
        },
    ]
}

// --- Duplicate Step ---

function duplicateStep(stepName: string, flowVersion: FlowVersion): FlowOperationRequest[] {
    const clonedAction: FlowAction = JSON.parse(JSON.stringify(flowStructureUtil.getActionOrThrow(stepName, flowVersion)))
    const allDescendants = collectDescendantSteps(clonedAction, flowVersion)
    const allActions = [clonedAction, ...allDescendants]
    const oldNameToNewName = actionUtils.mapToNewNames(flowVersion, allActions)

    const clonedMain = actionUtils.clone(JSON.parse(JSON.stringify(clonedAction)), oldNameToNewName)
    updateInternalRefs(clonedMain, oldNameToNewName)

    const operations: FlowOperationRequest[] = [
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                action: clonedMain,
                parentStep: stepName,
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            },
        },
    ]

    for (const descendant of allDescendants) {
        const clonedDescendant = actionUtils.clone(JSON.parse(JSON.stringify(descendant)), oldNameToNewName)
        updateInternalRefs(clonedDescendant, oldNameToNewName)
        operations.push({
            type: FlowOperationType.ADD_ACTION,
            request: {
                action: clonedDescendant,
                parentStep: findParentNameDirect(clonedMain, clonedDescendant.name),
                stepLocationRelativeToParent: findLocationRelativeToParentDirect(clonedMain, clonedDescendant.name),
                branchIndex: findBranchIndexDirect(clonedMain, clonedDescendant.name),
            },
        })
    }

    return operations
}

// --- Duplicate Branch ---

function duplicateBranch(routerName: string, childIndex: number, flowVersion: FlowVersion): FlowOperationRequest[] {
    const router = flowStructureUtil.getActionOrThrow(routerName, flowVersion) as RouterAction
    if (!router.branches) {
        return []
    }
    const branch = router.branches[childIndex]
    const operations: FlowOperationRequest[] = [{
        type: FlowOperationType.ADD_BRANCH,
        request: {
            branchName: `${branch.branchName} Copy`,
            branchIndex: childIndex + 1,
            stepName: routerName,
            conditions: branch.branchType === BranchExecutionType.CONDITION ? branch.conditions : undefined,
        },
    }]

    if (branch.steps.length > 0) {
        const branchSteps = branch.steps.map((name) => flowStructureUtil.getActionOrThrow(name, flowVersion))
        const allDescendants = branchSteps.flatMap((step) => [step, ...collectDescendantSteps(step, flowVersion)])
        const oldNameToNewName = actionUtils.mapToNewNames(flowVersion, allDescendants)

        for (let i = 0; i < branchSteps.length; i++) {
            const clonedStep: FlowAction = actionUtils.clone(JSON.parse(JSON.stringify(branchSteps[i])), oldNameToNewName)
            updateInternalRefs(clonedStep, oldNameToNewName)

            if (i === 0) {
                operations.push({
                    type: FlowOperationType.ADD_ACTION,
                    request: {
                        stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                        action: clonedStep,
                        parentStep: routerName,
                        branchIndex: childIndex + 1,
                    },
                })
            }
            else {
                operations.push({
                    type: FlowOperationType.ADD_ACTION,
                    request: {
                        action: clonedStep,
                        parentStep: oldNameToNewName[branchSteps[i - 1].name],
                        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                    },
                })
            }

            const descendants = collectDescendantSteps(branchSteps[i], flowVersion)
            for (const desc of descendants) {
                const clonedDesc = actionUtils.clone(JSON.parse(JSON.stringify(desc)), oldNameToNewName)
                updateInternalRefs(clonedDesc, oldNameToNewName)
                operations.push({
                    type: FlowOperationType.ADD_ACTION,
                    request: {
                        action: clonedDesc,
                        parentStep: findParentNameDirect(clonedStep, clonedDesc.name),
                        stepLocationRelativeToParent: findLocationRelativeToParentDirect(clonedStep, clonedDesc.name),
                        branchIndex: findBranchIndexDirect(clonedStep, clonedDesc.name),
                    },
                })
            }
        }
    }

    return operations
}

// --- Import Flow ---

function importFlow(flowVersion: FlowVersion, request: ImportFlowRequest): FlowOperationRequest[] {
    const existingStepNames = flowVersion.steps.map((s) => s.name)

    const deleteOperations = existingStepNames.map(name =>
        createDeleteActionOperation(name),
    )

    const importOperations = getImportOperationsForSteps(request.trigger, request.steps ?? [])

    return [
        createChangeNameOperation(request.displayName),
        ...deleteOperations,
        createUpdateTriggerOperation(request.trigger),
        ...importOperations,
        ...getImportOperationsForNotes(flowVersion, request),
    ]
}

// --- Copy Actions ---

function getActionsForCopy(selectedSteps: string[], flowVersion: FlowVersion): FlowAction[] {
    const allSteps = flowStructureUtil.getAllSteps(flowVersion)
    const actionsToCopy = selectedSteps
        .map((stepName) => flowStructureUtil.getStepOrThrow(stepName, flowVersion))
        .filter((step) => flowStructureUtil.isAction(step.type))
    return actionsToCopy
        .filter(step => !actionsToCopy.filter(parent => parent.name !== step.name).some(parent => flowStructureUtil.isChildOf(parent, step.name, flowVersion)))
        .map(step => JSON.parse(JSON.stringify(step)) as FlowAction)
        .sort((a, b) => allSteps.findIndex(s => s.name === a.name) - allSteps.findIndex(s => s.name === b.name))
}

// --- Paste Operations ---

function getOperationsForPaste(
    actions: FlowAction[],
    flowVersion: FlowVersion,
    pastingDetails: PasteLocation,
): FlowOperationRequest[] {
    const newNamesMap = actionUtils.mapToNewNames(flowVersion, actions)
    const clonedActions: FlowAction[] = actions.map(action => {
        const cloned: FlowAction = JSON.parse(JSON.stringify(action))
        return actionUtils.clone(cloned, newNamesMap)
    })
    const operations: FlowOperationRequest[] = []
    for (let i = 0; i < clonedActions.length; i++) {
        if (i === 0) {
            operations.push({
                type: FlowOperationType.ADD_ACTION,
                request: {
                    action: clonedActions[i],
                    parentStep: pastingDetails.parentStepName,
                    stepLocationRelativeToParent: pastingDetails.stepLocationRelativeToParent,
                    branchIndex: pastingDetails.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_BRANCH ? pastingDetails.branchIndex : undefined,
                },
            })
        }
        else {
            operations.push({
                type: FlowOperationType.ADD_ACTION,
                request: {
                    action: clonedActions[i],
                    parentStep: clonedActions[i - 1].name,
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                },
            })
        }
    }
    return operations
}

// --- Shared Helpers ---

function collectDescendantSteps(action: FlowAction, flowVersion: FlowVersion): FlowAction[] {
    const result: FlowAction[] = []
    const childRefs = flowStructureUtil.getDirectChildRefs(action)
    for (const name of childRefs) {
        const step = flowVersion.steps.find((s) => s.name === name)
        if (step) {
            result.push(step)
            result.push(...collectDescendantSteps(step, flowVersion))
        }
    }
    return result
}

function updateInternalRefs(action: FlowAction, nameMap: Record<string, string>): void {
    if (action.type === FlowActionType.LOOP_ON_ITEMS) {
        const loopAction = action as LoopOnItemsAction
        if (loopAction.children) {
            loopAction.children = loopAction.children.map((name) => nameMap[name] ?? name)
        }
    }
    if (action.type === FlowActionType.ROUTER) {
        const routerAction = action as RouterAction
        if (routerAction.branches) {
            for (const branch of routerAction.branches) {
                branch.steps = branch.steps.map((name) => nameMap[name] ?? name)
            }
        }
    }
}

function findParentNameDirect(action: FlowAction, _targetName: string): string {
    return action.name
}

function findLocationRelativeToParentDirect(action: FlowAction, targetName: string): StepLocationRelativeToParent {
    if (action.type === FlowActionType.LOOP_ON_ITEMS) {
        const loopAction = action as LoopOnItemsAction
        if (loopAction.children?.includes(targetName)) {
            return StepLocationRelativeToParent.INSIDE_LOOP
        }
    }
    if (action.type === FlowActionType.ROUTER) {
        const routerAction = action as RouterAction
        if (routerAction.branches) {
            for (const branch of routerAction.branches) {
                if (branch.steps.includes(targetName)) {
                    return StepLocationRelativeToParent.INSIDE_BRANCH
                }
            }
        }
    }
    return StepLocationRelativeToParent.AFTER
}

function findBranchIndexDirect(action: FlowAction, targetName: string): number | undefined {
    if (action.type === FlowActionType.ROUTER) {
        const routerAction = action as RouterAction
        if (routerAction.branches) {
            for (let i = 0; i < routerAction.branches.length; i++) {
                if (routerAction.branches[i].steps.includes(targetName)) {
                    return i
                }
            }
        }
    }
    return undefined
}

function getImportOperationsForSteps(trigger: FlowTrigger, steps: FlowAction[]): FlowOperationRequest[] {
    const operations: FlowOperationRequest[] = []
    const stepsMap = new Map(steps.map((s) => [s.name, s]))

    for (let i = 0; i < (trigger.steps ?? []).length; i++) {
        const stepName = trigger.steps[i]
        const step = stepsMap.get(stepName)
        if (!step) continue

        operations.push({
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: i === 0 ? trigger.name : trigger.steps[i - 1],
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                action: stripChildRefs(step),
            },
        })

        operations.push(...getChildImportOperations(step, stepsMap))
    }

    return operations
}

function getChildImportOperations(step: FlowAction, stepsMap: Map<string, FlowAction>): FlowOperationRequest[] {
    const operations: FlowOperationRequest[] = []

    switch (step.type) {
        case FlowActionType.LOOP_ON_ITEMS: {
            const loopStep = step as LoopOnItemsAction
            if (loopStep.children) {
                for (let i = 0; i < loopStep.children.length; i++) {
                    const childName = loopStep.children[i]
                    const childStep = stepsMap.get(childName)
                    if (!childStep) continue

                    if (i === 0) {
                        operations.push({
                            type: FlowOperationType.ADD_ACTION,
                            request: {
                                parentStep: step.name,
                                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
                                action: stripChildRefs(childStep),
                            },
                        })
                    }
                    else {
                        operations.push({
                            type: FlowOperationType.ADD_ACTION,
                            request: {
                                parentStep: loopStep.children[i - 1],
                                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                                action: stripChildRefs(childStep),
                            },
                        })
                    }

                    operations.push(...getChildImportOperations(childStep, stepsMap))
                }
            }
            break
        }
        case FlowActionType.ROUTER: {
            const routerStep = step as RouterAction
            if (routerStep.branches) {
                for (let branchIdx = 0; branchIdx < routerStep.branches.length; branchIdx++) {
                    const branch = routerStep.branches[branchIdx]
                    for (let i = 0; i < branch.steps.length; i++) {
                        const childName = branch.steps[i]
                        const childStep = stepsMap.get(childName)
                        if (!childStep) continue

                        if (i === 0) {
                            operations.push({
                                type: FlowOperationType.ADD_ACTION,
                                request: {
                                    parentStep: step.name,
                                    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                                    branchIndex: branchIdx,
                                    action: stripChildRefs(childStep),
                                },
                            })
                        }
                        else {
                            operations.push({
                                type: FlowOperationType.ADD_ACTION,
                                request: {
                                    parentStep: branch.steps[i - 1],
                                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                                    action: stripChildRefs(childStep),
                                },
                            })
                        }

                        operations.push(...getChildImportOperations(childStep, stepsMap))
                    }
                }
            }
            break
        }
        default:
            break
    }

    return operations
}

function stripChildRefs(action: FlowAction): FlowAction {
    const cloned: FlowAction = JSON.parse(JSON.stringify(action))
    if (cloned.type === FlowActionType.LOOP_ON_ITEMS) {
        (cloned as LoopOnItemsAction).children = []
    }
    if (cloned.type === FlowActionType.ROUTER) {
        const router = cloned as RouterAction
        if (router.branches) {
            router.branches = router.branches.map((b) => ({ ...b, steps: [] }))
        }
    }
    return cloned
}

function getImportOperationsForNotes(flowVersion: FlowVersion, request: ImportFlowRequest): FlowOperationRequest[] {
    return [
        ...flowVersion.notes.map((note): FlowOperationRequest => ({
            type: FlowOperationType.DELETE_NOTE,
            request: { id: note.id },
        })),
        ...(request.notes || []).map((note): FlowOperationRequest => ({
            type: FlowOperationType.ADD_NOTE,
            request: note,
        })),
    ]
}

function createDeleteActionOperation(actionName: string): FlowOperationRequest {
    return {
        type: FlowOperationType.DELETE_ACTION,
        request: { names: [actionName] },
    }
}

function createUpdateTriggerOperation(trigger: FlowTrigger): FlowOperationRequest {
    return {
        type: FlowOperationType.UPDATE_TRIGGER,
        request: trigger,
    }
}

function createChangeNameOperation(displayName: string): FlowOperationRequest {
    return {
        type: FlowOperationType.CHANGE_NAME,
        request: { displayName },
    }
}

export const compositeOperations = { moveAction, duplicateStep, duplicateBranch, importFlow, getImportOperationsForSteps, getActionsForCopy, getOperationsForPaste }

export type InsideBranchPasteLocation = {
    branchIndex: number
    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH
    parentStepName: string
}

export type OutsideBranchPasteLocation = {
    parentStepName: string
    stepLocationRelativeToParent:
    | StepLocationRelativeToParent.AFTER
    | StepLocationRelativeToParent.INSIDE_LOOP
}

export type PasteLocation = InsideBranchPasteLocation | OutsideBranchPasteLocation
