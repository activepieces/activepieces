
import { isNil } from '../../../common'
import { ActionType, BranchExecutionType, RouterAction, RouterExecutionType } from '../../actions/action'
import { FlowVersion } from '../../flow-version'
import { flowStructureUtil } from '../../util/flow-structure-util'
import { Migration } from '.'

export const migrateBranchToRouter: Migration = {
    migrate: (flowVersion: FlowVersion) => {
        if (!isNil(flowVersion.schemaVersion)) {
            return flowVersion
        }
        const newVersion = flowStructureUtil.transferFlow(flowVersion, (step) => {
            if (step.type === ActionType.BRANCH) {
                const routerAction: RouterAction = {
                    displayName: step.displayName,
                    name: step.name,
                    valid: step.valid,
                    type: ActionType.ROUTER,
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
                        inputUiInfo: {
                            sampleDataFileId: undefined,
                            lastTestDate: undefined,
                            customizedInputs: undefined,
                            currentSelectedData: undefined,
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