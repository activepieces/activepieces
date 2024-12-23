import { ProjectOperationType } from '@activepieces/ee-shared'
import { ActionType, assertNotNullOrUndefined, DEFAULT_SAMPLE_DATA_SETTINGS, flowPieceUtil, flowStructureUtil, FlowVersion, isNil, PopulatedFlow, FlowState, Step, TriggerType } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { ProjectMappingState } from './project-mapping-state'

export const projectDiffService = {
    diff({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
        const createFlowOperation = findFlowsToCreate({ newState, oldState, mapping })
        const deleteFlowOperation = findFlowsToDelete({ newState, oldState, mapping })
        const updateFlowOperations = findFlowsToUpdate({ newState, oldState, mapping })
        return [...deleteFlowOperation, ...createFlowOperation, ...updateFlowOperations]
    },
}

function findFlowsToCreate({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
    return newState.filter((newFile) => {
        const targetId = mapping.findTargetId(newFile.id)
        return isNil(targetId) || isNil(oldState.find((oldFile) => oldFile.id === targetId))
    }).map((state) => ({
        type: ProjectOperationType.CREATE_FLOW,
        state,
    }))
}
function findFlowsToDelete({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
    return oldState.filter((f) => {
        const sourceId = mapping.findSourceId(f.id)
        return isNil(sourceId) || isNil(newState.find((newFile) => newFile.id === sourceId))
    }).map((oldFile) => ({
        type: ProjectOperationType.DELETE_FLOW,
        state: oldFile,
    }))
}

function findFlowsToUpdate({ newState, oldState, mapping }: DiffParams): ProjectOperation[] {
    const operations: ProjectOperation[] = []

    console.log('mapping', mapping)
    console.log('newState', newState)
    console.log('oldState', oldState)

    const newStateFiles = newState.filter((state) => {
        const targetId = mapping.findTargetId(state.id)
        return !isNil(targetId) && !isNil(oldState.find((oldFile) => oldFile.id === targetId))
    })

    console.log('newStateFiles', newStateFiles)
    let num = 1
    newStateFiles.forEach((ns) => {
        const destFlowId = mapping.findTargetId(ns.id)
        const os = oldState.find((os) => os.id === destFlowId)!
        assertNotNullOrUndefined(os, `Could not find target flow for source flow ${ns.id}`)
        console.log('step ' + num)
        num++
        console.log('os', os)
        console.log('ns', ns)
        if (isFlowChanged(os, ns)) {
            operations.push({
                type: ProjectOperationType.UPDATE_FLOW,
                newState: ns,
                oldState: os,
            })
        }
    })
    console.log('operations', operations)
    return operations
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
    newState: FlowState[]
    oldState: FlowState[]
    mapping: ProjectMappingState
}



export const ProjectOperation = Type.Union([
    Type.Object({
        type: Type.Literal(ProjectOperationType.UPDATE_FLOW),
        newState: FlowState,
        oldState: FlowState,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.CREATE_FLOW),
        state: FlowState,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.DELETE_FLOW),
        state: FlowState,
    }),
])

export type ProjectOperation = Static<typeof ProjectOperation>
