import { isNil } from '../../../core/common'
import { ActivepiecesError, ErrorCode } from '../../../core/common/activepieces-error'
import { BranchCondition, BranchExecutionType, emptyCondition, FlowAction, FlowActionType, FlowBranch, LoopOnItemsAction, RouterAction } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { FlowTrigger, FlowTriggerType } from '../triggers/trigger'


export const AI_PIECE_NAME = '@activepieces/piece-ai'

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

function getActionOrThrow(name: string, flowVersion: FlowVersion): FlowAction {
    const step = getStepOrThrow(name, flowVersion)
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

function getTriggerOrThrow(name: string, flowVersion: FlowVersion): FlowTrigger {
    if (flowVersion.trigger.name === name) {
        return flowVersion.trigger
    }
    throw new ActivepiecesError({
        code: ErrorCode.STEP_NOT_FOUND,
        params: {
            stepName: name,
        },
    })
}

function getStep(name: string, flowVersion: FlowVersion): Step | undefined {
    if (flowVersion.trigger.name === name) {
        return flowVersion.trigger
    }
    return flowVersion.steps.find((step) => step.name === name)
}

function getStepOrThrow(name: string, flowVersion: FlowVersion): Step {
    const step = getStep(name, flowVersion)
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

function getAllSteps(flowVersion: FlowVersionLike): Step[] {
    return [flowVersion.trigger, ...flowVersion.steps]
}

function transferFlow(
    flowVersion: FlowVersion,
    transferFunction: (step: Step) => Step,
): FlowVersion {
    const clonedFlow: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    clonedFlow.trigger = transferFunction(clonedFlow.trigger) as FlowTrigger
    clonedFlow.steps = clonedFlow.steps.map((step) => transferFunction(step) as FlowAction)
    return clonedFlow
}

const createBranch = (branchName: string, conditions: BranchCondition[][] | undefined): FlowBranch => {
    if (conditions) {
        return {
            conditions,
            branchType: BranchExecutionType.CONDITION,
            branchName,
            steps: [],
        }
    }
    return {
        conditions: [[emptyCondition]],
        branchType: BranchExecutionType.CONDITION,
        branchName,
        steps: [],
    }
}

function findPathToStep(flowVersion: FlowVersion, targetStepName: string): StepWithIndex[] {
    const result: StepWithIndex[] = []
    const allSteps = getAllSteps(flowVersion)

    for (let i = 0; i < allSteps.length; i++) {
        const step = allSteps[i]
        if (isParentOf(step, targetStepName)) {
            result.push({ ...step, dfsIndex: i })
        }
    }
    return result
}

function isParentOf(step: Step, targetStepName: string): boolean {
    if (step.name === targetStepName) {
        return false
    }
    const stepRefs = getDirectChildRefs(step)
    if (stepRefs.includes(targetStepName)) {
        return true
    }
    return false
}

function getDirectChildRefs(step: Step): string[] {
    if (isTrigger(step.type)) {
        return (step as FlowTrigger).steps ?? []
    }
    switch (step.type) {
        case FlowActionType.LOOP_ON_ITEMS: {
            const loopAction = step as LoopOnItemsAction
            return loopAction.children ?? []
        }
        case FlowActionType.ROUTER: {
            const routerAction = step as RouterAction
            return (routerAction.branches ?? []).flatMap((branch) => branch.steps)
        }
        default:
            return []
    }
}

function getAllChildSteps(action: LoopOnItemsAction | RouterAction, flowVersion: FlowVersion): Step[] {
    const childNames = getDirectChildRefs(action)
    const result: Step[] = []
    for (const name of childNames) {
        const step = getStep(name, flowVersion)
        if (step) {
            result.push(step)
            if (step.type === FlowActionType.LOOP_ON_ITEMS || step.type === FlowActionType.ROUTER) {
                result.push(...getAllChildSteps(step as LoopOnItemsAction | RouterAction, flowVersion))
            }
        }
    }
    return result
}

function isChildOf(parent: Step, childStepName: string, flowVersion: FlowVersion): boolean {
    switch (parent.type) {
        case FlowActionType.ROUTER:
        case FlowActionType.LOOP_ON_ITEMS: {
            const children = getAllChildSteps(parent as LoopOnItemsAction | RouterAction, flowVersion)
            return children.some((c) => c.name === childStepName)
        }
        default:
            break
    }
    return false
}

const findUnusedNames = (flowVersion: FlowVersion, count = 1) => {
    const names = getAllSteps(flowVersion).map((f) => f.name)
    const unusedNames = []
    for (let i = 1; i <= count; i++) {
        const name = findUnusedName(names)
        unusedNames.push(name)
        names.push(name)
    }
    return unusedNames
}

const findUnusedName = (source: FlowVersion | string[]) => {
    const names = Array.isArray(source) ? source : getAllSteps(source).map((f) => f.name)
    let index = 1
    let name = 'step_1'
    while (names.includes(name)) {
        index++
        name = 'step_' + index
    }
    return name
}


function extractConnectionIdsFromAuth(auth: string): string[] {
    const match = auth.match(/{{connections\['([^']*(?:'\s*,\s*'[^']*)*)'\]}}/)
    if (!match || !match[1]) {
        return []
    }
    return match[1].split(/'\s*,\s*'/).map(id => id.trim())
}

function extractAgentIds(flowVersion: FlowVersion): string[] {
    return getAllSteps(flowVersion).map(step => getExternalAgentId(step)).filter(step => step !== null && step !== '')
}

function getExternalAgentId(action: Step) {
    if (isAgentPiece(action) && 'agentId' in action.settings.input) {
        return action.settings.input.agentId
    }
    return null
}

function isAgentPiece(action: Step) {
    return (
        action.type === FlowActionType.PIECE && action.settings.pieceName === AI_PIECE_NAME
    )
}

function extractConnectionIds(flowVersion: FlowVersion): string[] {
    const triggerAuthIds = flowVersion.trigger.settings?.input?.auth
        ? extractConnectionIdsFromAuth(flowVersion.trigger.settings.input.auth)
        : []

    const stepAuthIds = getAllSteps(flowVersion)
        .flatMap(step =>
            step.settings?.input?.auth
                ? extractConnectionIdsFromAuth(step.settings.input.auth)
                : [],
        )

    return Array.from(new Set([...triggerAuthIds, ...stepAuthIds]))
}

export const flowStructureUtil = {
    isTrigger,
    isAction,
    getAllSteps,
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
    getAllChildSteps,
    extractConnectionIds,
    isAgentPiece,
    extractAgentIds,
    getDirectChildRefs,
}

type FlowVersionLike = {
    trigger: FlowTrigger
    steps: FlowAction[]
}
