import { isNil } from '../../common'
import { ActivepiecesError, ErrorCode } from '../../common/activepieces-error'
import { BranchCondition, BranchExecutionType, emptyCondition, FlowAction, FlowActionType, LoopOnItemsAction, RouterAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { FlowTrigger, FlowTriggerType } from '../triggers/trigger'


export const AGENT_PIECE_NAME = '@activepieces/piece-agent'

export type Step = FlowAction | FlowTrigger
type StepWithIndex = Step & {
    dfsIndex: number
}

function isAction(type: FlowActionType | FlowTriggerType | undefined): type is FlowActionType {
    return Object.entries(FlowActionType).some(([, value]) => value === type)
}

function isTrigger(type: FlowActionType | FlowTriggerType | undefined): type is FlowTriggerType {
    return Object.entries(FlowTriggerType).some(([, value]) => value === type)
}

function getActionOrThrow(name: string, flowRoot: Step): FlowAction {
    const step = getStepOrThrow(name, flowRoot)
    if (!isAction(step.type)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                stepName: name,
            },
        })
    }
    return step as FlowAction
}

function getTriggerOrThrow(name: string, flowRoot: Step): FlowTrigger {
    const step = getStepOrThrow(name, flowRoot)
    if (!isTrigger(step.type)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                stepName: name,
            },
        })
    }
    return step as FlowTrigger
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
        case FlowActionType.LOOP_ON_ITEMS: {
            const { firstLoopAction } = updatedStep
            if (firstLoopAction) {
                updatedStep.firstLoopAction = transferStep(
                    firstLoopAction,
                    transferFunction,
                ) as FlowAction
            }
            break
        }
        case FlowActionType.ROUTER: {
            const { children } = updatedStep
            if (children) {
                updatedStep.children = children.map((child) =>
                    child ? (transferStep(child, transferFunction) as FlowAction) : null,
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
        ) as FlowAction
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
    ) as FlowTrigger
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

function findPathToStep(trigger: FlowTrigger, targetStepName: string): StepWithIndex[] {
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


function getAllChildSteps(action: LoopOnItemsAction | RouterAction): Step[] {
    return getAllSteps({
        ...action,
        nextAction: undefined,
    })
}

function isChildOf(parent: Step, childStepName: string): boolean {
    switch (parent.type) {
        case FlowActionType.ROUTER:
        case FlowActionType.LOOP_ON_ITEMS: {
            const children = getAllChildSteps(parent)
            return children.findIndex((c) => c.name === childStepName) > -1
        }
        default:
            break
    }
    return false
}

const findUnusedNames = (source: FlowTrigger | string[], count = 1) => {
    const names = Array.isArray(source) ? source : flowStructureUtil.getAllSteps(source).map((f) => f.name)
    const unusedNames = []
    for (let i = 1; i <= count; i++) {
        const name = findUnusedName(names)
        unusedNames.push(name)
        names.push(name)
    }
    return unusedNames
}

const findUnusedName = (source: FlowTrigger | string[]) => {
    const names = Array.isArray(source) ? source : flowStructureUtil.getAllSteps(source).map((f) => f.name)
    let index = 1
    let name = 'step_1'
    while (names.includes(name)) {
        index++
        name = 'step_' + index
    }
    return name
}


function getAllNextActionsWithoutChildren(start: Step): Step[] {
    const actions: Step[] = []
    let currentAction = start.nextAction

    while (!isNil(currentAction)) {
        actions.push(currentAction)
        currentAction = currentAction.nextAction
    }

    return actions
}


function extractConnectionIdsFromAuth(auth: string): string[] {
    const match = auth.match(/{{connections\['([^']*(?:'\s*,\s*'[^']*)*)'\]}}/)
    if (!match || !match[1]) {
        return []
    }
    return match[1].split(/'\s*,\s*'/).map(id => id.trim())
}

function extractConnectionIds(flowVersion: FlowVersion): string[] {
    const triggerAuthIds = flowVersion.trigger.settings?.input?.auth
        ? extractConnectionIdsFromAuth(flowVersion.trigger.settings.input.auth)
        : []

    const stepAuthIds = flowStructureUtil
        .getAllSteps(flowVersion.trigger)
        .flatMap(step =>
            step.settings?.input?.auth
                ? extractConnectionIdsFromAuth(step.settings.input.auth)
                : [],
        )

    return Array.from(new Set([...triggerAuthIds, ...stepAuthIds]))
}

function extractAgentIds(flowVersion: FlowVersion): string[] {
    return flowStructureUtil.getAllSteps(flowVersion.trigger).map(step => getExternalAgentId(step)).filter(step => step !== null && step !== '')
}

function getExternalAgentId(action: Step) {
    if (isAgentPiece(action)) {
        return action.settings.input.agentId
    }
    return null
}

function isAgentPiece(action: Step) {
    return (
        action.type === FlowActionType.PIECE && action.settings.pieceName === AGENT_PIECE_NAME
    )
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
    findUnusedNames,
    getAllNextActionsWithoutChildren,
    getAllChildSteps,
    extractConnectionIds,
    extractAgentIds,
    isAgentPiece,
    getExternalAgentId,
}