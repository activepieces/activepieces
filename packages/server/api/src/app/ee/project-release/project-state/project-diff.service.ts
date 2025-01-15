import { ProjectOperationType } from '@activepieces/ee-shared'
import { ActionType, assertNotNullOrUndefined, DEFAULT_SAMPLE_DATA_SETTINGS, flowPieceUtil, FlowState, flowStructureUtil, FlowVersion, isNil, PopulatedFlow, ProjectState, Step, TriggerType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const projectDiffService = {
    diff({ newState, currentState }: DiffParams): ProjectOperation[] {
        const createFlowOperation = findFlowsToCreate({ newState, currentState })
        const deleteFlowOperation = findFlowsToDelete({ newState, currentState })
        const updateFlowOperations = findFlowsToUpdate({ newState, currentState })
        return [...deleteFlowOperation, ...createFlowOperation, ...updateFlowOperations]
    },
}

function findFlowsToCreate({ newState, currentState }: DiffParams): ProjectOperation[] {
    return newState.flows.filter((newFlow) => {
        const flow = searchInFlowForFlowByIdOrExternalId(currentState.flows, newFlow.id)
        return isNil(flow)
    }).map((flowState) => ({
        type: ProjectOperationType.CREATE_FLOW,
        flowState,
    }))
}
function findFlowsToDelete({ newState, currentState }: DiffParams): ProjectOperation[] {
    return currentState.flows.filter((currentFlowFromState) => {
        const flow = newState.flows.find((flowFromNewState) => currentFlowFromState.externalId === flowFromNewState.id || currentFlowFromState.id === flowFromNewState.id)
        return isNil(flow)
    }).map((flowState) => ({
        type: ProjectOperationType.DELETE_FLOW,
        flowState,
    }))
}

function findFlowsToUpdate({ newState, currentState }: DiffParams): ProjectOperation[] {
    const newStateFiles = newState.flows.filter((state) => {
        const flow = searchInFlowForFlowByIdOrExternalId(currentState.flows, state.id)
        return !isNil(flow)
    })
    return newStateFiles.map((flowFromNewState) => {
        const os = searchInFlowForFlowByIdOrExternalId(currentState.flows, flowFromNewState.id)
        assertNotNullOrUndefined(os, `Could not find target flow for source flow ${flowFromNewState.id}`)
        if (isFlowChanged(os, flowFromNewState)) {
            return {
                type: ProjectOperationType.UPDATE_FLOW,
                flowState: os,
                newFlowState: flowFromNewState,
            } as ProjectOperation
        }
        return null
    }).filter((op): op is ProjectOperation => op !== null)
}

function searchInFlowForFlowByIdOrExternalId(flows: PopulatedFlow[], id: string): PopulatedFlow | undefined {
    return flows.find((flow) => flow.id === id || flow.externalId === id)
}

function isFlowChanged(fromFlow: PopulatedFlow, targetFlow: PopulatedFlow): boolean {

    const normalizedFromFlow = normalize(fromFlow.version)
    const normalizedTargetFlow = normalize(targetFlow.version)
    return normalizedFromFlow.displayName !== normalizedTargetFlow.displayName
        || JSON.stringify(normalizedFromFlow.trigger) !== JSON.stringify(normalizedTargetFlow.trigger)
}


function normalize(flowVersion: FlowVersion): FlowVersion {
    const flowUpgradable = flowPieceUtil.makeFlowAutoUpgradable(flowVersion)
    return flowStructureUtil.transferFlow(flowUpgradable, (step) => {
        const clonedStep: Step = JSON.parse(JSON.stringify(step))
        clonedStep.settings.inputUiInfo = DEFAULT_SAMPLE_DATA_SETTINGS
        const authExists = clonedStep?.settings?.input?.auth
        if (authExists && [ActionType.PIECE, TriggerType.PIECE].includes(step.type)) {
            clonedStep.settings.input.auth = ''
        }
        return clonedStep
    })
}


type DiffParams = {
    currentState: {
        flows: PopulatedFlow[]
    }
    newState: Pick<ProjectState, 'flows'>
}



export const ProjectOperation = Type.Union([
    Type.Object({
        type: Type.Literal(ProjectOperationType.UPDATE_FLOW),
        newFlowState: FlowState,
        flowState: FlowState,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.CREATE_FLOW),
        flowState: FlowState,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.DELETE_FLOW),
        flowState: FlowState,
    }),
])

export type ProjectOperation = Static<typeof ProjectOperation>
