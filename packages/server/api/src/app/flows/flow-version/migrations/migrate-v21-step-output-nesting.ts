import {
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    isNil,
    Step,
} from '@activepieces/shared'
import { expressionRewriter } from './expression-rewriter'
import { Migration } from '.'

function wrapStepReferencesInOutputProperty <T>(value: T, stepNames: string[]): T {
    if (typeof value === 'string') {
        return expressionRewriter.rewriteStepReferences({ input: value, stepNames }) as T
    }
    if (Array.isArray(value)) {
        return value.map((item) => wrapStepReferencesInOutputProperty(item, stepNames)) as T
    }
    if (!isNil(value) && typeof value === 'object') {
        const result: Record<string, unknown> = {}
        for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
            result[key] = wrapStepReferencesInOutputProperty(child, stepNames)
        }
        return result as T
    }
    return value
}

export const migrateV21StepOutputNesting: Migration = {
    targetSchemaVersion: '21',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const stepNames = flowStructureUtil.getAllSteps(flowVersion.trigger).map((step) => step.name)
        const newFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step: Step) => {
            const newStep = {
                ...step,
                settings: wrapStepReferencesInOutputProperty(step.settings, stepNames),
            }
            if (newStep.type === FlowActionType.CODE) {
                newStep.settings.sourceCode = step.settings.sourceCode
            }
            return newStep
        })
        return {
            ...newFlowVersion,
            schemaVersion: '22',
        }
    },
}
