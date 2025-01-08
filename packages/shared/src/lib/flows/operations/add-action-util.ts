import { applyFunctionToValuesSync, isString } from '../../common'
import { Action } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'


function mapToNewNames(flowVersion: FlowVersion, clonedActions: Action[]): Record<string, string> {
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
        step.settings = {
            ...step.settings,
            inputUiInfo: {
                ...step.settings.inputUiInfo,
                currentSelectedData: undefined,
                sampleDataFileId: undefined,
                lastTestDate: undefined,
            },
        }
    }
    return step
}

export const addActionUtls = {
    mapToNewNames,
    clone,
}