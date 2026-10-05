import { insertAt } from '@activepieces/core-utils'
import { BranchExecutionType, FlowActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { AddBranchRequest } from '.'


function _addBranch(flowVersion: FlowVersion, request: AddBranchRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (parentStep) => {
        if (parentStep.name !== request.stepName || !flowStructureUtil.isBranchedAction(parentStep)) {
            return parentStep
        }
        const children = insertAt(parentStep.children, request.branchIndex, null)
        if (parentStep.type === FlowActionType.AI_ROUTER) {
            return {
                ...parentStep,
                settings: {
                    ...parentStep.settings,
                    branches: insertAt(parentStep.settings.branches, request.branchIndex, {
                        branchType: BranchExecutionType.CONDITION as const,
                        branchName: request.branchName,
                        description: request.description ?? '',
                    }),
                },
                children,
            }
        }
        return {
            ...parentStep,
            settings: {
                ...parentStep.settings,
                branches: insertAt(parentStep.settings.branches, request.branchIndex, flowStructureUtil.createBranch(request.branchName, request.conditions)),
            },
            children,
        }
    })
}

export { _addBranch }
