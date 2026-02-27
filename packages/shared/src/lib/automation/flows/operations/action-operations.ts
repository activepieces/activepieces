import { TypeCompiler } from '@sinclair/typebox/compiler'
import { applyFunctionToValuesSync, isNil, isString } from '../../../core/common'
import { ActivepiecesError, ErrorCode } from '../../../core/common/activepieces-error'
import { FlowAction, FlowActionType, LoopOnItemsAction, RouterAction, SingleActionSchema } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { AddActionRequest, DeleteActionRequest, SkipActionRequest, StepLocationRelativeToParent, UpdateActionRequest } from './index'

const actionSchemaValidator = TypeCompiler.Compile(SingleActionSchema)

function createAction(request: UpdateActionRequest): FlowAction {
    const baseProperties = {
        displayName: request.displayName,
        name: request.name,
        valid: false,
        skip: request.skip,
        settings: {
            ...request.settings,
            customLogoUrl: request.settings.customLogoUrl,
        },
    }
    let action: FlowAction
    switch (request.type) {
        case FlowActionType.ROUTER:
            action = {
                ...baseProperties,
                type: FlowActionType.ROUTER,
                settings: request.settings,
                branches: request.branches ?? [],
            }
            break
        case FlowActionType.LOOP_ON_ITEMS:
            action = {
                ...baseProperties,
                type: FlowActionType.LOOP_ON_ITEMS,
                settings: request.settings,
                children: [],
            }
            break
        case FlowActionType.PIECE:
            action = {
                ...baseProperties,
                type: FlowActionType.PIECE,
                settings: request.settings,
            }
            break
        case FlowActionType.CODE:
            action = {
                ...baseProperties,
                type: FlowActionType.CODE,
                settings: request.settings,
            }
            break
    }
    const valid = (isNil(request.valid) ? true : request.valid) && actionSchemaValidator.Check(action)
    return {
        ...action,
        valid,
    }
}

// --- Add Action ---

function handleLoopOnItems(loopStep: LoopOnItemsAction, request: AddActionRequest, flowVersion: FlowVersion): FlowVersion {
    const newAction = createAction(request.action)

    if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_LOOP) {
        const updatedChildren = [newAction.name, ...(loopStep.children ?? [])]
        return updateStepInFlowVersion(flowVersion, loopStep.name, { ...loopStep, children: updatedChildren }, newAction)
    }
    else if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.AFTER) {
        return addStepAfter(flowVersion, loopStep.name, newAction)
    }
    else {
        throw new ActivepiecesError({
            code: ErrorCode.FLOW_OPERATION_INVALID,
            params: {
                message: `Loop step parent ${request.stepLocationRelativeToParent} not found`,
            },
        })
    }
}

function handleRouter(routerStep: RouterAction, request: AddActionRequest, flowVersion: FlowVersion): FlowVersion {
    const newAction = createAction(request.action)

    if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_BRANCH && !isNil(request.branchIndex)) {
        const branches = [...(routerStep.branches ?? [])]
        const branch = { ...branches[request.branchIndex] }
        branch.steps = [newAction.name, ...branch.steps]
        branches[request.branchIndex] = branch
        return updateStepInFlowVersion(flowVersion, routerStep.name, { ...routerStep, branches }, newAction)
    }
    else if (request.stepLocationRelativeToParent === StepLocationRelativeToParent.AFTER) {
        return addStepAfter(flowVersion, routerStep.name, newAction)
    }
    else {
        throw new ActivepiecesError({
            code: ErrorCode.FLOW_OPERATION_INVALID,
            params: {
                message: `Router step parent ${request.stepLocationRelativeToParent} not found`,
            },
        })
    }
}

function addStepAfter(flowVersion: FlowVersion, parentName: string, newAction: FlowAction): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))

    // Parent is the trigger itself — insert at the beginning of trigger.steps
    if (cloned.trigger.name === parentName) {
        cloned.trigger.steps.unshift(newAction.name)
        cloned.steps.push(newAction)
        return cloned
    }

    // Check trigger steps list
    const triggerIdx = cloned.trigger.steps.indexOf(parentName)
    if (triggerIdx !== -1) {
        cloned.trigger.steps.splice(triggerIdx + 1, 0, newAction.name)
        cloned.steps.push(newAction)
        return cloned
    }

    // Check loop children and router branches
    for (const step of cloned.steps) {
        if (step.type === FlowActionType.LOOP_ON_ITEMS) {
            const loopStep = step as LoopOnItemsAction
            if (loopStep.children) {
                const childIdx = loopStep.children.indexOf(parentName)
                if (childIdx !== -1) {
                    loopStep.children.splice(childIdx + 1, 0, newAction.name)
                    cloned.steps.push(newAction)
                    return cloned
                }
            }
        }
        if (step.type === FlowActionType.ROUTER) {
            const routerStep = step as RouterAction
            if (routerStep.branches) {
                for (const branch of routerStep.branches) {
                    const branchIdx = branch.steps.indexOf(parentName)
                    if (branchIdx !== -1) {
                        branch.steps.splice(branchIdx + 1, 0, newAction.name)
                        cloned.steps.push(newAction)
                        return cloned
                    }
                }
            }
        }
    }

    throw new ActivepiecesError({
        code: ErrorCode.FLOW_OPERATION_INVALID,
        params: {
            message: `Parent step ${parentName} not found in any step list`,
        },
    })
}

function updateStepInFlowVersion(flowVersion: FlowVersion, stepName: string, updatedStep: FlowAction, newAction: FlowAction): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    cloned.steps = cloned.steps.map((s) => s.name === stepName ? updatedStep : s)
    cloned.steps.push(newAction)
    return cloned
}

function add(flowVersion: FlowVersion, request: AddActionRequest): FlowVersion {
    const parentStep = flowStructureUtil.getStepOrThrow(request.parentStep, flowVersion)

    switch (parentStep.type) {
        case FlowActionType.LOOP_ON_ITEMS:
            return handleLoopOnItems(parentStep as LoopOnItemsAction, request, flowVersion)
        case FlowActionType.ROUTER:
            return handleRouter(parentStep as RouterAction, request, flowVersion)
        default: {
            const newAction = createAction(request.action)
            return addStepAfter(flowVersion, request.parentStep, newAction)
        }
    }
}

// --- Delete Action ---

function removeNameRef(flowVersion: FlowVersion, name: string): FlowVersion {
    flowVersion.trigger.steps = flowVersion.trigger.steps.filter((s) => s !== name)

    for (const step of flowVersion.steps) {
        if (step.type === FlowActionType.LOOP_ON_ITEMS) {
            const loopStep = step as LoopOnItemsAction
            if (loopStep.children) {
                loopStep.children = loopStep.children.filter((s) => s !== name)
            }
        }
        if (step.type === FlowActionType.ROUTER) {
            const routerStep = step as RouterAction
            if (routerStep.branches) {
                for (const branch of routerStep.branches) {
                    branch.steps = branch.steps.filter((s) => s !== name)
                }
            }
        }
    }
    return flowVersion
}

function remove(flowVersion: FlowVersion, request: DeleteActionRequest): FlowVersion {
    let clonedVersion: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    for (const name of request.names) {
        clonedVersion = removeNameRef(clonedVersion, name)
        clonedVersion.steps = clonedVersion.steps.filter((s) => s.name !== name)
    }
    return clonedVersion
}

// --- Update Action ---

function update(flowVersion: FlowVersion, request: UpdateActionRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (stepToUpdate.name !== request.name) {
            return stepToUpdate
        }

        const baseProps = {
            displayName: request.displayName,
            name: request.name,
            valid: false,
            skip: request.skip,
            settings: {
                ...stepToUpdate.settings,
                customLogoUrl: request.settings.customLogoUrl,
            },
        }

        let updatedAction: FlowAction
        switch (request.type) {
            case FlowActionType.CODE: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: FlowActionType.CODE,
                }
                break
            }
            case FlowActionType.PIECE: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: FlowActionType.PIECE,
                }
                break
            }
            case FlowActionType.LOOP_ON_ITEMS: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: FlowActionType.LOOP_ON_ITEMS,
                    children: 'children' in stepToUpdate ? (stepToUpdate as LoopOnItemsAction).children : [],
                }
                break
            }

            case FlowActionType.ROUTER: {
                updatedAction = {
                    ...baseProps,
                    settings: request.settings,
                    type: FlowActionType.ROUTER,
                    branches: 'branches' in stepToUpdate ? (stepToUpdate as RouterAction).branches : [],
                }
                break
            }
        }
        const valid = (isNil(request.valid) ? true : request.valid) && actionSchemaValidator.Check(updatedAction)
        return {
            ...updatedAction,
            valid,
        }
    })
}

// --- Skip Action ---

function skip(flowVersion: FlowVersion, request: SkipActionRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (stepToUpdate) => {
        if (!request.names.includes(stepToUpdate.name)) {
            return stepToUpdate
        }
        return {
            ...stepToUpdate,
            skip: request.skip,
        }
    })
}

// --- Action Utils (used by composite-operations) ---

function mapToNewNames(flowVersion: FlowVersion, clonedActions: FlowAction[]): Record<string, string> {
    const existingNames = flowStructureUtil.getAllSteps(flowVersion)
        .map(step => step.name)

    const oldStepNames = clonedActions.map(step => step.name)

    return oldStepNames.reduce((nameMap, oldName) => {
        const newName = flowStructureUtil.findUnusedName(existingNames)
        existingNames.push(newName)
        return { ...nameMap, [oldName]: newName }
    }, {} as Record<string, string>)
}

function replaceOldStepNameWithNewOne({
    input,
    oldStepName,
    newStepName,
}: ReplaceOldStepNameWithNewOneProps): string {
    const regex = /{{(.*?)}}/g
    return input.replace(regex, (match, content) => {
        const replacedContent = content.replaceAll(
            new RegExp(`\\b${oldStepName}\\b`, 'g'),
            `${newStepName}`,
        )
        return `{{${replacedContent}}}`
    })
}

function clone(step: FlowAction, oldNameToNewName: Record<string, string>): FlowAction {
    step.displayName = `${step.displayName} Copy`
    step.name = oldNameToNewName[step.name]
    if ('input' in step.settings) {
        Object.keys(oldNameToNewName).forEach((oldName) => {
            const settings = step.settings as { input: unknown }
            settings.input = applyFunctionToValuesSync(
                settings.input,
                (value: unknown) => {
                    if (isString(value)) {
                        return replaceOldStepNameWithNewOne({
                            input: value,
                            oldStepName: oldName,
                            newStepName: oldNameToNewName[oldName],
                        })
                    }
                    return value
                },
            )
        })
    }
    if (step.settings.sampleData) {
        step.settings = {
            ...step.settings,
            sampleData: {},
        }
    }
    return step
}

export const actionOperations = { add, remove, update, skip, createAction }
export const actionUtils = { mapToNewNames, clone }

type ReplaceOldStepNameWithNewOneProps = {
    input: string
    oldStepName: string
    newStepName: string
}
