import { isNil } from '../../common'
import { ActivepiecesError, ErrorCode } from '../../common/activepieces-error'
import { Action, ActionType, BranchCondition, BranchExecutionType, emptyCondition, LoopOnItemsAction, RouterAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { Trigger, TriggerType } from '../triggers/trigger'

export type Step = Action | Trigger
type StepWithIndex = Step & {
    dfsIndex: number
}

function isAction(type: ActionType | TriggerType | undefined): boolean {
    return Object.entries(ActionType).some(([, value]) => value === type)
}

function isTrigger(type: ActionType | TriggerType | undefined): boolean {
    return Object.entries(TriggerType).some(([, value]) => value === type)
}

function getActionOrThrow(name: string, flowRoot: Step): Action {
    const step = getStepOrThrow(name, flowRoot)
    if (!isAction(step.type)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                stepName: name,
            },
        })
    }
    return step as Action
}

function getTriggerOrThrow(name: string, flowRoot: Step): Trigger {
    const step = getStepOrThrow(name, flowRoot)
    if (!isTrigger(step.type)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                stepName: name,
            },
        })
    }
    return step as Trigger
}

function getStep(name: string, flowRoot: Step): Step | undefined {
    return getAllSteps(flowRoot).find((step) => step.name === name)
}

function getStepOrThrow(name: string, flowRoot: Step): Step {
    const step = getStep(name, flowRoot)
    if (isNil(step)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                stepName: name,
            },
        })
    }
    return step
}

function transferStep<T extends Step>(
    step: Step,
    transferFunction: (step: T) => T,
): Step {
    const updatedStep = transferFunction(step as T)
    switch (updatedStep.type) {
        case ActionType.LOOP_ON_ITEMS: {
            const { firstLoopAction } = updatedStep
            if (firstLoopAction) {
                updatedStep.firstLoopAction = transferStep(
                    firstLoopAction,
                    transferFunction,
                ) as Action
            }
            break
        }
        case ActionType.ROUTER: {
            const { children } = updatedStep
            if (children) {
                updatedStep.children = children.map((child) =>
                    child ? (transferStep(child, transferFunction) as Action) : null,
                )
            }
            break
        }
        default:
            break
    }

    if (updatedStep.nextAction) {
        updatedStep.nextAction = transferStep(
            updatedStep.nextAction,
            transferFunction,
        ) as Action
    }

    return updatedStep
}


function transferFlow<T extends Step>(
    flowVersion: FlowVersion,
    transferFunction: (step: T) => T,
): FlowVersion {
    const clonedFlow = JSON.parse(JSON.stringify(flowVersion))
    clonedFlow.trigger = transferStep(
        clonedFlow.trigger,
        transferFunction,
    ) as Trigger
    return clonedFlow
}

function getAllSteps(step: Step): Step[] {
    const steps: Step[] = []
    transferStep(step, (currentStep) => {
        steps.push(currentStep)
        return currentStep
    })
    return steps
}


const createBranch = (branchName: string, conditions: BranchCondition[][] | undefined) => {
    return {
        conditions: conditions ?? [[emptyCondition]],
        branchType: BranchExecutionType.CONDITION,
        branchName,
    }
}

function findPathToStep(trigger: Trigger, targetStepName: string): StepWithIndex[] {
    const steps = flowStructureUtil.getAllSteps(trigger).map((step, dfsIndex) => ({
        ...step,
        dfsIndex,
    }))
    return steps
        .filter((step) => {
            const steps = flowStructureUtil.getAllSteps(step)
            return steps.some((s) => s.name === targetStepName)
        })
        .filter((step) => step.name !== targetStepName)
}


function getAllChildSteps(action: LoopOnItemsAction  | RouterAction): Step[] {
    return getAllSteps({
        ...action,
        nextAction: undefined,
    })
}

function isChildOf(parent: Step, childStepName: string): boolean {
    switch (parent.type) {
        case ActionType.ROUTER: 
        case ActionType.LOOP_ON_ITEMS: {
            const children = getAllChildSteps(parent)
            return children.findIndex((c) => c.name === childStepName) > -1
        }
        default:
            break
    }
    return false
}

const findUnusedName = (trigger: Trigger) => {
    const names = flowStructureUtil.getAllSteps(trigger).map((f) => f.name)
    let index = 1
    let name = 'step_1'
    while (names.includes(name)) {
        index++
        name = 'step_' + index
    }
    return name
}
  

export const flowStructureUtil = {
    isTrigger,
    isAction,
    getAllSteps,
    transferStep,
    transferFlow,
    getStepOrThrow,
    getActionOrThrow,
    getTriggerOrThrow,
    getStep,
    createBranch,
    findPathToStep,
    isChildOf,
    findUnusedName,
}