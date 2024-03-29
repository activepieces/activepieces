import { PopulatedFlow, assertNotNullOrUndefined, flowHelper, isNil } from '@activepieces/shared'
import { ProjectMappingState } from './project-mapping-state'
import { ProjectOperationType } from '@activepieces/ee-shared'
import { Static, Type } from '@sinclair/typebox'

export const projectDiffService = {
    diff({ fromFlows, destinationFlows, mapping }: DiffParams): ProjectOperation[] {
        const createFlowOperation = findFlowsToCreate({ fromFlows, destinationFlows, mapping })
        const deleteFlowOperation = findFlowsToDelete({ fromFlows, destinationFlows, mapping })
        const updateFlowOperations = findFlowsToUpdate({ fromFlows, destinationFlows, mapping })
        return [...deleteFlowOperation, ...createFlowOperation, ...updateFlowOperations]
    },
}

function findFlowsToCreate({ fromFlows, destinationFlows, mapping }: DiffParams): ProjectOperation[] {
    return fromFlows.filter((f) => {
        const targetId = mapping.findTargetId(f.id)
        return isNil(targetId) || isNil(destinationFlows.find((fl) => fl.id === targetId))
    }).map((f) => ({
        type: ProjectOperationType.CREATE_FLOW,
        flow: f,
    }))
}
function findFlowsToDelete({ fromFlows, destinationFlows, mapping }: DiffParams): ProjectOperation[] {
    return destinationFlows.filter((f) => {
        const sourceId = mapping.findSourceId(f.id)
        return isNil(sourceId) || isNil(fromFlows.find((fl) => fl.id === sourceId))
    }).map((f) => ({
        type: ProjectOperationType.DELETE_FLOW,
        flow: f,
    }))
}

function findFlowsToUpdate({ fromFlows, destinationFlows, mapping }: DiffParams): ProjectOperation[] {
    return fromFlows.filter((f) => {
        const targetId = mapping.findTargetId(f.id)
        return !isNil(targetId) && !isNil(destinationFlows.find((fl) => fl.id === targetId))
    }).map((f) => {
        const destFlowId = mapping.findTargetId(f.id)
        const targetFlow = destinationFlows.find((fl) => fl.id === destFlowId)!
        assertNotNullOrUndefined(targetFlow, `Could not find target flow for source flow ${f.id}`)
        return {
            type: ProjectOperationType.UPDATE_FLOW,
            flow: f,
            targetFlow,
        }
    }).filter((op) => isFlowChanged(op.flow, op.targetFlow))
}

function isFlowChanged(fromFlow: PopulatedFlow, targetFlow: PopulatedFlow): boolean {

    return fromFlow.version.displayName !== targetFlow.version.displayName
        || JSON.stringify(flowHelper.normalize(fromFlow.version).trigger) !== JSON.stringify(flowHelper.normalize(targetFlow.version).trigger)
}


type DiffParams = {
    fromFlows: PopulatedFlow[]
    destinationFlows: PopulatedFlow[]
    mapping: ProjectMappingState
}

export const ProjectOperation = Type.Union([
    Type.Object({
        type: Type.Literal(ProjectOperationType.UPDATE_FLOW),
        flow: PopulatedFlow,
        targetFlow: PopulatedFlow,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.CREATE_FLOW),
        flow: PopulatedFlow,
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.DELETE_FLOW),
        flow: PopulatedFlow,
    }),
])

export type ProjectOperation = Static<typeof ProjectOperation>
