import { ProjectOperationType } from '@activepieces/ee-shared'
import { ActionType, assertNotNullOrUndefined, DEFAULT_SAMPLE_DATA_SETTINGS, flowPieceUtil, FlowState, flowStructureUtil, FlowVersion, isNil, PopulatedFlow, Step, TriggerType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { ProjectMappingState, ProjectState } from './project-mapping-state'

export const projectDiffService = {
    diff({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
        const createFlowOperation = findFlowsToCreate({ newState, oldState, mapping })
        const deleteFlowOperation = findFlowsToDelete({ newState, oldState, mapping })
        const updateFlowOperations = findFlowsToUpdate({ newState, oldState, mapping })
        return [...deleteFlowOperation, ...createFlowOperation, ...updateFlowOperations]
    },
}

function findFlowsToCreate({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
    return newState.flows.filter((newFile) => {
        const targetId = mapping.findTargetId(newFile.id)
        return isNil(targetId) || isNil(oldState.flows.find((oldFile) => oldFile.id === targetId))
    }).map((flowState) => ({
        type: ProjectOperationType.CREATE_FLOW,
        flowState,
    }))
}
function findFlowsToDelete({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
    return oldState.flows.filter((f) => {
        const sourceId = mapping.findSourceId(f.id)
        return isNil(sourceId) || isNil(newState.flows.find((newFile) => newFile.id === sourceId))
    }).map((flowState) => ({
        type: ProjectOperationType.DELETE_FLOW,
        flowState,
    }))
}

function findFlowsToUpdate({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
    const newStateFiles = newState.flows.filter((state) => {
        const targetId = mapping.findTargetId(state.id)
        return !isNil(targetId) && !isNil(oldState.flows.find((oldFile) => oldFile.id === targetId))
    })
    return newStateFiles.map((ns) => {
        const destFlowId = mapping.findTargetId(ns.id)
        const os = oldState.flows.find((os) => os.id === destFlowId)!
        assertNotNullOrUndefined(os, `Could not find target flow for source flow ${ns.id}`)
        if (isFlowChanged(os, ns)) {
            return {
                type: ProjectOperationType.UPDATE_FLOW,
                flowState: ns,
                newFlowState: os,
            } as ProjectOperation
        }
        return null
    }).filter((op): op is ProjectOperation => op !== null)
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
    newState: ProjectState
    oldState: ProjectState
    mapping: ProjectMappingState
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
