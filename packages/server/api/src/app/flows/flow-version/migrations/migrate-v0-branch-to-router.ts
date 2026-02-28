import { BranchExecutionType, FlowActionKind, FlowVersion, RouterExecutionType } from '@activepieces/shared'
import { legacyFlowStructureUtil, LegacyStep } from './legacy-flow-structure-util'
import { Migration } from '.'

export const migrateBranchToRouter: Migration = {
    targetSchemaVersion: undefined,
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = legacyFlowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type === 'BRANCH') {
                const routerAction: LegacyStep = {
                    displayName: step.displayName,
                    name: step.name,
                    valid: step.valid,
                    type: FlowActionKind.ROUTER,
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
                    nextAction: step.nextAction,
                    children: [step.onSuccessAction ?? null, step.onFailureAction ?? null],
                }
                return routerAction
            }
            return step
        })
        return {
            ...newVersion,
            schemaVersion: '1',
        }
    },
}
