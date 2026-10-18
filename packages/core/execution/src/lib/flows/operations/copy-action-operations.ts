import { FlowAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'

export function _getActionsForCopy(selectedSteps: string[], flowVersion: FlowVersion): FlowAction[] {
    const allStepNames = flowStructureUtil.getAllSteps(flowVersion.trigger).map((step) => step.name)
    const actionsToCopy = selectedSteps
        .map((stepName) => flowStructureUtil.getStepOrThrow(stepName, flowVersion.trigger))
        .filter((step) => flowStructureUtil.isAction(step.type))
    return actionsToCopy
        .filter(step => !actionsToCopy.filter(parent => parent.name !== step.name).some(parent => flowStructureUtil.isChildOf(parent, step.name)))
        .sort((a, b) => allStepNames.indexOf(a.name) - allStepNames.indexOf(b.name))
        .map(step => {
            const clonedAction = JSON.parse(JSON.stringify(step))
            clonedAction.nextAction = undefined
            return clonedAction
        })
}
