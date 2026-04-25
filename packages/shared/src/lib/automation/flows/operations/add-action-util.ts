import dayjs from 'dayjs'
import { applyFunctionToValuesSync, isString } from '../../../core/common'
import { BranchCondition, BranchExecutionType, FlowAction, FlowActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'


function mapToNewNames(flowVersion: FlowVersion, clonedActions: FlowAction[]): Record<string, string> {
    const existingNames = flowStructureUtil.getAllSteps(flowVersion.trigger)
        .map(step => step.name)

    const oldStepNames = clonedActions.flatMap(clonedAction => flowStructureUtil.getAllSteps(clonedAction).map(step => step.name))

    return oldStepNames.reduce((nameMap, oldName) => {
        const newName = flowStructureUtil.findUnusedName(existingNames)
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

function replaceInBranchConditions(
    conditions: BranchCondition[][],
    oldNameToNewName: Record<string, string>,
): BranchCondition[][] {
    return conditions.map(group =>
        group.map((condition) => {
            const newCondition = { ...condition }
            Object.keys(oldNameToNewName).forEach((oldName) => {
                const newStepName = oldNameToNewName[oldName]
                newCondition.firstValue = replaceOldStepNameWithNewOne({
                    input: newCondition.firstValue,
                    oldStepName: oldName,
                    newStepName,
                })
                if ('secondValue' in newCondition) {
                    newCondition.secondValue = replaceOldStepNameWithNewOne({
                        input: newCondition.secondValue,
                        oldStepName: oldName,
                        newStepName,
                    })
                }
            })
            return newCondition
        }),
    )
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
    if (step.type === FlowActionType.ROUTER && step.settings.branches) {
        step.settings.branches = step.settings.branches.map((branch) => {
            if (branch.branchType !== BranchExecutionType.CONDITION || !branch.conditions) {
                return branch
            }
            return {
                ...branch,
                conditions: replaceInBranchConditions(branch.conditions, oldNameToNewName),
            }
        })
    }
    if (step.settings.sampleData) {
        step.settings = {
            ...step.settings,
            sampleData: {},
        }
    }
    step.lastUpdatedDate = dayjs().toISOString()
    return step
}

export const addActionUtils = {
    mapToNewNames,
    clone,
    replaceInBranchConditions,
}
