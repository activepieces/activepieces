import dayjs from 'dayjs'
import { applyFunctionToValuesSync, isNil } from '@activepieces/core-utils'
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

function remapStepReferences({ text, oldNameToNewName }: RemapStepReferencesProps): string {
    // TODO: replace this naive /{{(.*?)}}/g tokenizer with `extractMustacheTokens`
    // from @activepieces/core-utils. The lazy regex stops at the first `}}`, so a token
    // whose content contains `}}` (e.g. a string literal) is truncated and the
    // trailing step name is not renamed on duplicate/paste. Swap deferred — needs
    // duplicate/paste re-testing in the builder before landing.
    return text.replace(/{{(.*?)}}/g, (_token, expression: string) =>
        `{{${expression.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (identifier) => oldNameToNewName[identifier] ?? identifier)}}}`)
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
    const sourceCode = 'sourceCode' in step.settings ? step.settings.sourceCode : undefined
    step.settings = applyFunctionToValuesSync(
        step.settings,
        (value) => remapStepReferences({ text: value, oldNameToNewName }),
    )
    if (!isNil(sourceCode) && 'sourceCode' in step.settings) {
        step.settings.sourceCode = sourceCode
    }
    step.lastUpdatedDate = dayjs().toISOString()
    return step
}

export const addActionUtils = {
    mapToNewNames,
    clone,
}

type RemapStepReferencesProps = {
    text: string
    oldNameToNewName: Record<string, string>
}
