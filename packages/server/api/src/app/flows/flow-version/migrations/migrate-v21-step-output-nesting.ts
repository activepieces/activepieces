import {
    FlowActionType,
    flowStructureUtil,
    FlowVersion,
    Step,
} from '@activepieces/shared'
import { expressionRewriter } from './expression-rewriter'
import { Migration } from '.'

export const migrateV21StepOutputNesting: Migration = {
    targetSchemaVersion: '21',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const stepNames = flowStructureUtil.getAllSteps(flowVersion.trigger).map((step) => step.name)
        const newFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step: Step) => {
            const newStep = {
                ...step,
                settings: expressionRewriter.rewriteDeep(step.settings, stepNames),
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
