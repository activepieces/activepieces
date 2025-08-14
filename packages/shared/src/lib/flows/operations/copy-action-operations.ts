import { FlowAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { _getImportOperations } from './import-flow'

export function _getActionsForCopy(selectedSteps: string[], flowVersion: FlowVersion): FlowAction[] {
    const allSteps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    const actionsToCopy = selectedSteps
        .map((stepName) => flowStructureUtil.getStepOrThrow(stepName, flowVersion.trigger))
        .filter((step) => flowStructureUtil.isAction(step.type))
    return actionsToCopy
        .filter(step => !actionsToCopy.filter(parent => parent.name !== step.name).some(parent => flowStructureUtil.isChildOf(parent, step.name)))
        .map(step => {
            const clonedAction = JSON.parse(JSON.stringify(step))
            clonedAction.nextAction = undefined
            return clonedAction
        })
        .sort((a, b) => allSteps.indexOf(a) - allSteps.indexOf(b)) as FlowAction[]
}
