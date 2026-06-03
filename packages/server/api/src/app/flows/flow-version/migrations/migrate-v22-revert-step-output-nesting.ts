import {
    flowStructureUtil,
    FlowVersion,
    isNil,
    Step,
} from '@activepieces/shared'
import { expressionRewriter } from './expression-rewriter'
import { Migration } from '.'

const COF_BRANCHES_KEY = 'continueOnFailureBranches'

function unwrapStepReferences<T>(value: T, stepNames: string[]): T {
    if (typeof value === 'string') {
        return expressionRewriter.unwrapStepReferences({ input: value, stepNames }) as T
    }
    if (Array.isArray(value)) {
        return value.map((item) => unwrapStepReferences(item, stepNames)) as T
    }
    if (!isNil(value) && typeof value === 'object') {
        const result: Record<string, unknown> = {}
        for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
            // Drop the reverted feature's continue-on-failure branches entirely
            // rather than descending into their (now-unsupported) sub-trees.
            if (key === COF_BRANCHES_KEY) {
                continue
            }
            result[key] = unwrapStepReferences(child, stepNames)
        }
        return result as T
    }
    return value
}

export const migrateV22RevertStepOutputNesting: Migration = {
    targetSchemaVersion: '22',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const stepNames = flowStructureUtil.getAllSteps(flowVersion.trigger).map((step) => step.name)
        const newFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step: Step) => ({
            ...step,
            settings: unwrapStepReferences(step.settings, stepNames),
        }))
        return {
            ...newFlowVersion,
            schemaVersion: '23',
        }
    },
}
