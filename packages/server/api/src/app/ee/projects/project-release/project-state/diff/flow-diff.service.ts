import { assertNotNullOrUndefined, DEFAULT_SAMPLE_DATA_SETTINGS, FlowActionKind, flowPieceUtil, FlowProjectOperationType, FlowState, flowStructureUtil, FlowTriggerKind, FlowVersion, isNil, mapsAreSame, ProjectOperation, ProjectState, Step } from '@activepieces/shared'
import deepEqual from 'deep-equal'
import semver from 'semver'

export const flowDiffService = {
    async diff({ newState, currentState }: DiffParams): Promise<ProjectOperation[]> {
        const createFlowOperation = await findFlowsToCreate({ newState, currentState })
        const deleteFlowOperation = await findFlowsToDelete({ newState, currentState })
        const updateFlowOperations = await findFlowsToUpdate({ newState, currentState })
        return [...deleteFlowOperation, ...createFlowOperation, ...updateFlowOperations]
    },
}

async function findFlowsToCreate({ newState, currentState }: DiffParams): Promise<ProjectOperation[]> {
    return newState.flows.filter((newFlow) => {
        const flow = searchInFlowForFlowByIdOrExternalId(currentState.flows, newFlow.externalId)
        return isNil(flow)
    }).map((flowState) => ({
        type: FlowProjectOperationType.CREATE_FLOW,
        flowState,
    }))
}

async function findFlowsToDelete({ newState, currentState }: DiffParams): Promise<ProjectOperation[]> {
    return currentState.flows.filter((currentFlowFromState) => {
        const flow = newState.flows.find((flowFromNewState) => currentFlowFromState.externalId === flowFromNewState.externalId)
        return isNil(flow)
    }).map((flowState) => ({
        type: FlowProjectOperationType.DELETE_FLOW,
        flowState,
    }))
}

async function findFlowsToUpdate({ newState, currentState }: DiffParams): Promise<ProjectOperation[]> {
    const newStateFiles = newState.flows.filter((state) => {
        const flow = searchInFlowForFlowByIdOrExternalId(currentState.flows, state.externalId)
        return !isNil(flow)
    })

    const operations = await Promise.all(newStateFiles.map(async (flowFromNewState) => {
        const os = searchInFlowForFlowByIdOrExternalId(currentState.flows, flowFromNewState.externalId)
        assertNotNullOrUndefined(os, `Could not find target flow for source flow ${flowFromNewState.externalId}`)
        const flowChanged = await isFlowChanged(os, flowFromNewState)
        if (flowChanged) {
            return {
                type: FlowProjectOperationType.UPDATE_FLOW,
                flowState: os,
                newFlowState: flowFromNewState,
            } as ProjectOperation
        }
        return null
    }))
    
    return operations.filter((op): op is ProjectOperation => op !== null)
}

function searchInFlowForFlowByIdOrExternalId(flows: FlowState[], externalId: string): FlowState | undefined {
    return flows.find((flow) => flow.externalId === externalId)
}

function isSameVersion(versionOne: string, versionTwo: string): boolean {
    const cleanedVersionOne = flowPieceUtil.getExactVersion(versionOne)
    const cleanedVersionTwo = flowPieceUtil.getExactVersion(versionTwo)
    
    const versionOneObj = semver.parse(cleanedVersionOne)
    const versionTwoObj = semver.parse(cleanedVersionTwo)
    
    if (!versionOneObj || !versionTwoObj) {
        return cleanedVersionOne === cleanedVersionTwo
    }
    
    if (versionOneObj.major >= 1 || versionTwoObj.major >= 1) {
        return versionOneObj.major === versionTwoObj.major
    }
    else {
        return versionOneObj.major === versionTwoObj.major && 
               versionOneObj.minor === versionTwoObj.minor
    }
}

async function isFlowChanged(fromFlow: FlowState, targetFlow: FlowState): Promise<boolean> {
    const stepsPieceVersionsFrom = new Map<string, string>()
    const stepsPiecesVersionTo = new Map<string, string>()
    const notesFrom = new Map<string, string>()
    const notesTo = new Map<string, string>()
    
    flowStructureUtil.getAllSteps(fromFlow.version).forEach((step) => {
        if ([FlowActionKind.PIECE, FlowTriggerKind.PIECE].includes(step.data.kind)) {
            stepsPieceVersionsFrom.set(step.id, (step.data.settings as Record<string, string>).pieceVersion)
        }
    })

    flowStructureUtil.getAllSteps(targetFlow.version).forEach((step) => {
        if ([FlowActionKind.PIECE, FlowTriggerKind.PIECE].includes(step.data.kind)) {
            stepsPiecesVersionTo.set(step.id, (step.data.settings as Record<string, string>).pieceVersion)
        }
    })

    fromFlow.version.notes.forEach((note) => {
        notesFrom.set(note.id, note.content)
    })
    targetFlow.version.notes.forEach((note) => {
        notesTo.set(note.id, note.content)
    })
    const notesMatched = mapsAreSame(notesFrom, notesTo)

    const isMatched = Array.from(stepsPieceVersionsFrom.entries()).every(([key, value]) => {
        const versionTwo = stepsPiecesVersionTo.get(key)
        if (isNil(versionTwo) || isNil(value)) {
            return false
        }
        return isSameVersion(versionTwo, value)
    })

    const normalizedFromFlow = await normalize(fromFlow.version)
    const normalizedTargetFlow = await normalize(targetFlow.version)
    return normalizedFromFlow.displayName !== normalizedTargetFlow.displayName
        || !deepEqual(normalizedFromFlow.graph, normalizedTargetFlow.graph) || !isMatched || !notesMatched
}

async function normalize(flowVersion: FlowVersion): Promise<FlowVersion> {
    const flowUpgradable = flowPieceUtil.makeFlowAutoUpgradable(flowVersion)
    return flowStructureUtil.transferFlow(flowUpgradable, (step) => {
        const clonedStep: Step = JSON.parse(JSON.stringify(step))
        const settings = clonedStep.data.settings as Record<string, unknown>
        settings.sampleData = DEFAULT_SAMPLE_DATA_SETTINGS
        const input = settings.input as Record<string, unknown> | undefined
        const authExists = input?.auth

        if ([FlowActionKind.PIECE, FlowTriggerKind.PIECE].includes(clonedStep.data.kind)) {
            (settings as Record<string, string>).pieceVersion = ''
            if (authExists) {
                input!.auth = ''
            }
        }
        return clonedStep
    })
}

type DiffParams = {
    currentState: ProjectState
    newState: ProjectState
} 
