import { BranchExecutionType, FlowActionType, FlowVersion, RouterExecutionType, Step } from '@activepieces/shared'
import { Migration } from '.'
import { legacyFlowStructureUtil, LegacyStep } from './legacy-flow-structure-util'

export const migrateBranchToRouter: Migration = {
    targetSchemaVersion: undefined,
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = legacyFlowStructureUtil.transferFlow(flowVersion, (step) => {
            const unschemedStep = step as unknown as LegacyStep
            if (unschemedStep.type === 'BRANCH') {
                const routerAction = {
                    displayName: step.displayName,
                    name: step.name,
                    valid: step.valid,
                    type: FlowActionType.ROUTER,
                    skip: false,
                    settings: {
                        branches: [
                            {
                                branchName: 'Branch 1',
                                conditions: step.settings.conditions,
                                branchType: BranchExecutionType.CONDITION,
                            },
                            {
                                branchName: 'Otherwise',
                                branchType: BranchExecutionType.FALLBACK,
                            },
                        ],
                        executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                        sampleData: {
                            sampleDataFileId: undefined,
                            sampleDataInputFileId: undefined,
                            lastTestDate: undefined,
                        },
                    },
                    nextAction: unschemedStep.nextAction,
                    children: [unschemedStep.onSuccessAction ?? null, unschemedStep.onFailureAction ?? null],
                }
                return routerAction as unknown as Step
            }
            return step
        })
        return {
            ...newVersion,
            schemaVersion: '1',
        }
    },
}
