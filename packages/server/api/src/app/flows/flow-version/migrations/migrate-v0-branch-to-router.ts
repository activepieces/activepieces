import { BranchExecutionType, FlowAction, FlowActionType, flowStructureUtil, FlowVersion, RouterAction, RouterExecutionType } from '@activepieces/shared'
import { Migration } from '.'

export const migrateBranchToRouter: Migration = {
    targetSchemaVersion: undefined,
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            const unschemedStep = step as unknown as { type: string, settings: { conditions: unknown[] }, onSuccessAction: FlowAction | null, onFailureAction: FlowAction | null }
            if (unschemedStep.type === 'BRANCH') {
                const routerAction: RouterAction = {
                    displayName: step.displayName,
                    name: step.name,
                    valid: step.valid,
                    type: FlowActionType.ROUTER,
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
                    children: [unschemedStep.onSuccessAction ?? null, unschemedStep.onFailureAction ?? null],
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