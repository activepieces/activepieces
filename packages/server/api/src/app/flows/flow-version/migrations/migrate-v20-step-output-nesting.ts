import {
    expressionRewriter,
    flowStructureUtil,
    FlowVersion,
    isNil,
    Step,
} from '@activepieces/shared'
import { Migration } from '.'

const COF_BRANCHES_KEY = 'continueOnFailureBranches'

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
            // Skip continueOnFailureBranches: transferStep recurses into onSuccess/onFailure
            // separately, so descending here would double-rewrite their string contents.
            if (key === COF_BRANCHES_KEY) {
                result[key] = child
                continue
            }
            result[key] = wrapStepReferencesInOutputProperty(child, stepNames)
        }
        return result as T
    }
    return value
}

export const migrateV20StepOutputNesting: Migration = {
    targetSchemaVersion: '20',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const stepNames = flowStructureUtil.getAllSteps(flowVersion.trigger).map((step) => step.name)
        const newFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step: Step) => ({
            ...step,
            settings: wrapStepReferencesInOutputProperty(step.settings, stepNames),
        }))
        return {
            ...newFlowVersion,
            schemaVersion: '21',
        }
    },
}
