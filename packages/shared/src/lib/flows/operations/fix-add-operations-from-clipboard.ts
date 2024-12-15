import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { EMPTY_STEP_PARENT_NAME } from './get-add-actions-to-copy'
import { AddActionRequest, StepLocationRelativeToParent } from './index'

const replaceOldStepNamesAndMarkMissingSteps = (
    actionSettings: string,
    newStepsNamesMap: Record<string, string>,
): string => {
    const regex = new RegExp(
        '({{\\s*)step_(\\d+)(\\s*(?:[.\\[].*?)?\\s*}})',
        'g',
    )
    const allStepsInSettings = [...actionSettings.matchAll(regex)]
    return allStepsInSettings.reduce((acc, regexMatch) => {
        const stepName = `step_${regexMatch[2]}`
        const stepNameRegex = new RegExp(
            `({{\\s*)${stepName}(\\s*(?:[.\\[].*?)?\\s*}})`,
            'g',
        )
        if (newStepsNamesMap[stepName]) {
            return acc.replaceAll(stepNameRegex, `$1${newStepsNamesMap[stepName]}$2`)
        }
        return acc
    }, actionSettings)
}

const modifyAddRequestsActionsNames = (
    operations: AddActionRequest[],
    flowVersion: FlowVersion,
) => {
    const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const allStepsNames = allSteps.map((step) => step.name)
    const newStepsNamesMap = operations.reduce((acc, operation) => {
        const unusedName = flowStructureUtil.findUnusedName(allStepsNames)
        allStepsNames.push(unusedName)
        acc[operation.action.name] = unusedName
        return acc
    }, {} as Record<string, string>)
    const allStepsDisplayNames = [...allSteps.map((step) => step.displayName)]

    return operations.map((operation) => {
        const settingsWithNewStepNames = replaceOldStepNamesAndMarkMissingSteps(
            JSON.stringify(operation.action.settings),
            newStepsNamesMap,
        )
        const displayName =
      allStepsDisplayNames.findIndex(
          (displayName) => displayName === operation.action.displayName,
      ) > -1
          ? `${operation.action.displayName} Copy`
          : operation.action.displayName
        allStepsDisplayNames.push(displayName)
        return {
            ...operation,
            action: {
                ...operation.action,
                name: newStepsNamesMap[operation.action.name],
                settings: JSON.parse(settingsWithNewStepNames),
                displayName,
            },
            parentStep:
        newStepsNamesMap[operation.parentStep] || EMPTY_STEP_PARENT_NAME,
        }
    }) as AddActionRequest[]
}

export const _fixAddOperationsFromClipboard = (
    operations: AddActionRequest[],
    flowVersion: FlowVersion,
    pastingDetails:
    | {
        parentStepName: string
        stepLocationRelativeToParent:
        | StepLocationRelativeToParent.AFTER
        | StepLocationRelativeToParent.INSIDE_LOOP
    }
    | {
        branchIndex: number
        stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH
        parentStepName: string
    },
) => {
    const operationsToAddNewSteps = modifyAddRequestsActionsNames(
        operations,
        flowVersion,
    )
    const firstOperationWithoutParentStep = operationsToAddNewSteps.find(
        (operation) => operation.parentStep === EMPTY_STEP_PARENT_NAME,
    )!
    firstOperationWithoutParentStep.parentStep = pastingDetails.parentStepName
    firstOperationWithoutParentStep.branchIndex =
    pastingDetails.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_BRANCH
        ? pastingDetails.branchIndex
        : undefined
    firstOperationWithoutParentStep.stepLocationRelativeToParent =
    pastingDetails.stepLocationRelativeToParent
    return operationsToAddNewSteps
        .map((request) => {
            if (request.parentStep !== EMPTY_STEP_PARENT_NAME) {
                return request
            }
            return {
                ...request,
                parentStep: firstOperationWithoutParentStep.action.name,
                branchIndex: undefined,
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            }
        })
  
}
