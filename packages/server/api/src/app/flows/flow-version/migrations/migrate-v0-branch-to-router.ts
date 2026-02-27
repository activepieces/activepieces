import { BranchExecutionType, FlowActionType, FlowVersion, RouterAction, RouterExecutionType } from '@activepieces/shared'
import { Migration } from '.'
import { legacyFlowStructureUtil } from './legacy-flow-structure-util'

export const migrateBranchToRouter: Migration = {
    targetSchemaVersion: undefined,
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newVersion = legacyFlowStructureUtil.transferFlow(flowVersion, (step) => {
            const unschemedStep = step as unknown as { type: string, settings: { conditions: unknown[] } }
            if (unschemedStep.type === 'BRANCH') {
                const routerAction: RouterAction = {
                    displayName: step.displayName,
                    name: step.name,
                    valid: step.valid,
                    type: FlowActionType.ROUTER,
                    skip: false,
                    settings: {
                        executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                    },
                    branches: [
                        {
                            branchName: 'Branch 1',
                            conditions: step.settings.conditions,
                            branchType: BranchExecutionType.CONDITION,
                            steps: [],
                        },
                        {
                            branchName: 'Otherwise',
                            branchType: BranchExecutionType.FALLBACK,
                            steps: [],
                        },
                    ],
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