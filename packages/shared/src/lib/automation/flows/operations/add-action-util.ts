import dayjs from 'dayjs'
import { applyFunctionToValuesSync, isString } from '../../../core/common'
import { BranchExecutionType, FlowAction, FlowActionType, RouterActionSettings } from '../actions/action'
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


function clone(step: FlowAction, oldNameToNewName: Record<string, string>): FlowAction {
    step.displayName = `${step.displayName} Copy`
    step.name = oldNameToNewName[step.name]
    Object.keys(oldNameToNewName).forEach((oldName) => {
        if ('input' in step.settings) {
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
        }
        if (step.type === FlowActionType.LOOP_ON_ITEMS) {
            step.settings.items = replaceOldStepNameWithNewOne({
                input: step.settings.items,
                oldStepName: oldName,
                newStepName: oldNameToNewName[oldName],
            })
        }
        if (step.type === FlowActionType.ROUTER) {
            const routerSettings = step.settings as RouterActionSettings
            routerSettings.branches = routerSettings.branches.map((branch) => {
                if (branch.branchType !== BranchExecutionType.CONDITION) {
                    return branch
                }
                return {
                    ...branch,
                    conditions: branch.conditions.map((conditionGroup) =>
                        conditionGroup.map((condition) => ({
                            ...condition,
                            firstValue: replaceOldStepNameWithNewOne({
                                input: condition.firstValue,
                                oldStepName: oldName,
                                newStepName: oldNameToNewName[oldName],
                            }),
                            ...('secondValue' in condition
                                ? {
                                    secondValue: replaceOldStepNameWithNewOne({
                                        input: condition.secondValue,
                                        oldStepName: oldName,
                                        newStepName: oldNameToNewName[oldName],
                                    }),
                                }
                                : {}),
                        })),
                    ),
                }
            })
        }
    })
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
}