import dayjs from 'dayjs'
import { applyFunctionToValuesSync } from '@activepieces/core-utils'
import { FlowAction } from '../actions/action'
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
    // TODO: replace this naive /{{(.*?)}}/g tokenizer with `extractMustacheTokens`
    // from @activepieces/shared. The lazy regex stops at the first `}}`, so a token
    // whose content contains `}}` (e.g. a string literal) is truncated and the
    // trailing step name is not renamed on duplicate/paste. Swap deferred — needs
    // duplicate/paste re-testing in the builder before landing.
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
    if (step.settings.sampleData) {
        step.settings = {
            ...step.settings,
            sampleData: {},
        }
    }
    step.settings = applyFunctionToValuesSync(
        step.settings,
        (value) => Object.keys(oldNameToNewName).reduce(
            (renamed, oldName) => replaceOldStepNameWithNewOne({
                input: renamed,
                oldStepName: oldName,
                newStepName: oldNameToNewName[oldName],
            }),
            value,
        ),
    )
    step.lastUpdatedDate = dayjs().toISOString()
    return step
}

export const addActionUtils = {
    mapToNewNames,
    clone,
}