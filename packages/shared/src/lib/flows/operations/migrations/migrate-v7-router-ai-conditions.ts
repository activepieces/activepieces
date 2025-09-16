import { BranchExecutionType, ConditionType, FlowActionType } from '../../actions/action'
import { FlowVersion } from '../../flow-version'
import { flowStructureUtil } from '../../util/flow-structure-util'
import { Migration } from '.'

export const migrateRouterAiConditionsV7: Migration = {
    targetSchemaVersion: '7',
    migrate: (flowVersion: FlowVersion): FlowVersion => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type === FlowActionType.ROUTER) {
                return {
                    ...step,
                    settings: {
                        ...step.settings,
                        branches: step.settings.branches.map((branch) => ({
                            ...branch,
                            prompt: branch.branchType === BranchExecutionType.CONDITION ? branch.prompt ?? '' : '',
                        })),
                        conditionType: ConditionType.TEXT,
                    },
                }
            }
            return step
        })
        
        return {
            ...newVersion,
            schemaVersion: '8',
        }
    },
}