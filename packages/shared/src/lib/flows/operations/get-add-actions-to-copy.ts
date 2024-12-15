import { Action, ActionType } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { flowStructureUtil } from '../util/flow-structure-util'
import { removeAnySubsequentAction } from './import-flow'
import { AddActionRequest, StepLocationRelativeToParent } from '.'

export const EMPTY_STEP_PARENT_NAME = 'empty-step-parent'

const clearSampleDataInfo = (
    settings: AddActionRequest['action']['settings'],
) => {
    const newSettings = JSON.parse(
        JSON.stringify(settings),
    ) as AddActionRequest['action']['settings']
    delete newSettings.inputUiInfo?.sampleDataFileId
    delete newSettings.inputUiInfo?.lastTestDate
    return newSettings
}

export const _getAddActionsToCopy = ({
    selectedSteps,
    flowVersion,
}: {
    selectedSteps: string[]
    flowVersion: FlowVersion
}): AddActionRequest[] => {
    const steps = selectedSteps
        .map((stepName) => flowStructureUtil.getStepOrThrow(stepName, flowVersion.trigger))
        .filter((step) => flowStructureUtil.isAction(step.type)) as Action[]
    return steps
        .map((step) => {
            if (!flowStructureUtil.isTrigger(step.type)) {
                const pathToStep = flowStructureUtil.findPathToStep(
                    flowVersion.trigger,
                    step.name,
                )
                const firstPreviousAction = pathToStep.reverse().find((s) => {
                    return selectedSteps.findIndex((n) => n === s.name) > -1
                })
                const stepWithoutChildren = removeAnySubsequentAction(step)
                if (firstPreviousAction) {
                    const isPreviousStepTheParent = flowStructureUtil.isChildOf(
                        firstPreviousAction,
                        step.name,
                    )

                    if (isPreviousStepTheParent) {
                        const branchIndex =
              firstPreviousAction.type !== ActionType.ROUTER
                  ? undefined
                  : firstPreviousAction.children.findIndex((c) =>
                      c
                          ? flowStructureUtil.isChildOf(c, step.name) ||
                        c.name === step.name
                          : false,
                  )

                        return {
                            action: stepWithoutChildren,
                            parentStep: firstPreviousAction.name,
                            stepLocationRelativeToParent:
                firstPreviousAction.type === ActionType.LOOP_ON_ITEMS
                    ? StepLocationRelativeToParent.INSIDE_LOOP
                    : StepLocationRelativeToParent.INSIDE_BRANCH,
                            branchIndex,
                        }
                    }

                    return {
                        action: stepWithoutChildren,
                        parentStep: firstPreviousAction.name,
                        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                    }
                }

                return {
                    action: stepWithoutChildren,
                    parentStep: EMPTY_STEP_PARENT_NAME,
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                }
            }
            return undefined
        })
        .filter((operation) => operation !== undefined)
        .map(op=>{
            return ({
                ...op,
                action: {
                    ...op.action,
                    settings: clearSampleDataInfo(op.action.settings),
                },
            }) as AddActionRequest
        })
}
