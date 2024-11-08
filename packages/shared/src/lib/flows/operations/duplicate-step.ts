import { applyFunctionToValuesSync, isNil, isString } from '../../common'
import { Action, BranchExecutionType, RouterAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { _getImportOperations } from './import-flow'
import { FlowOperationRequest, FlowOperationType, StepLocationRelativeToParent } from '.'


function findUnusedName(existingNames: string[], prefix: string): string {
    let index = 1
    let name = `${prefix}_${index}`
    while (existingNames.includes(name)) {
        index++
        name = `${prefix}_${index}`
    }
    return name
}

function mapToNewNames(flowVersion: FlowVersion, clonedAction: Action): Record<string, string> {
    const existingNames = flowStructureUtil.getAllSteps(flowVersion.trigger)
        .map(step => step.name)

    const oldStepNames = flowStructureUtil.getAllSteps(clonedAction)
        .map(step => step.name)

    return oldStepNames.reduce((nameMap, oldName) => {
        const newName = findUnusedName(existingNames, 'step')
        existingNames.push(newName)
        return { ...nameMap, [oldName]: newName }
    }, {} as Record<string, string>)
}

type ReplaceOldStepNameWithNewOneProps = {
    input: string
    oldStepName: string
    newStepName: string
}

function replaceOldStepNameWithNewOne({
    input,
    oldStepName,
    newStepName,
}: ReplaceOldStepNameWithNewOneProps): string {
    const regex = /{{(.*?)}}/g // Regular expression to match strings inside {{ }}
    return input.replace(regex, (match, content) => {
        // Replace the content inside {{ }} using the provided function
        const replacedContent = content.replaceAll(
            new RegExp(`\\b${oldStepName}\\b`, 'g'),
            `${newStepName}`,
        )
        // Reconstruct the {{ }} with the replaced content
        return `{{${replacedContent}}}`
    })
}


function clone(step: Action, oldNameToNewName: Record<string, string>): Action {
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
    if (step.settings.inputUiInfo) {
        step.settings.inputUiInfo.currentSelectedData = undefined
        step.settings.inputUiInfo.sampleDataFileId = undefined
        step.settings.inputUiInfo.lastTestDate = undefined
    }
    return step
}

function _duplicateStep(stepName: string, flowVersion: FlowVersion): FlowOperationRequest[] {
    const clonedAction: Action = JSON.parse(JSON.stringify(flowStructureUtil.getActionOrThrow(stepName, flowVersion.trigger)))
    const clonedActionWithoutNextAction = {
        ...clonedAction,
        nextAction: undefined,
    }
    const oldNameToNewName = mapToNewNames(flowVersion, clonedActionWithoutNextAction)
    const clonedSubflow = flowStructureUtil.transferStep(clonedActionWithoutNextAction, (step: Action) => {
        return clone(step, oldNameToNewName)
    })
    const importOperations = _getImportOperations(clonedSubflow)

    return [
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                action: clonedSubflow as Action,
                parentStep: stepName,
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            },
        },
        ...importOperations,
    ]
}

function _duplicateBranch(
    routerName: string,
    childIndex: number,
    flowVersion: FlowVersion,
): FlowOperationRequest[] {
    const router = flowStructureUtil.getActionOrThrow(routerName, flowVersion.trigger)
    const clonedRouter: RouterAction = JSON.parse(JSON.stringify(router))
    const operations: FlowOperationRequest[] = [{
        type: FlowOperationType.ADD_BRANCH,
        request: {
            branchName: `${clonedRouter.settings.branches[childIndex].branchName} Copy`,
            branchIndex: childIndex + 1,
            stepName: routerName,
            conditions: clonedRouter.settings.branches[childIndex].branchType === BranchExecutionType.CONDITION ? clonedRouter.settings.branches[childIndex].conditions : undefined,
        },
    }]

    const childRouter = clonedRouter.children[childIndex]
    if (!isNil(childRouter)) {
        const oldNameToNewName = mapToNewNames(flowVersion, childRouter)
        const clonedSubflow = flowStructureUtil.transferStep(childRouter, (step: Action) => {
            return clone(step, oldNameToNewName)
        })
        const importOperations = _getImportOperations(clonedSubflow)
        operations.push({
            type: FlowOperationType.ADD_ACTION,
            request: {
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                action: clonedSubflow as Action,
                parentStep: routerName,
                branchIndex: childIndex + 1,
            },
        })
        operations.push(...importOperations)
    }

    return operations
}

export { _duplicateStep, _duplicateBranch }