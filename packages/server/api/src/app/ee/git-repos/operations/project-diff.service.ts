import { PopulatedFlow, isNil } from '@activepieces/shared'
import { ProjectMappingState, ProjectOperation } from './sync-operations'
import { ProjectOperationType } from '@activepieces/ee-shared'


export async function findFlowOperations({ fromFlows, destinationFlows, mapping }: DiffParams): Promise<ProjectOperation[]> {
    const createFlows = findFlowToCreate({ fromFlows, destinationFlows, mapping })
    const deleteOrUpdateFlows = findFlowToDeleteOrUpdate({ fromFlows, destinationFlows, mapping })
    return [...createFlows, ...deleteOrUpdateFlows]
}

export function createOrUpdateFlowOperation({ fromFlow, destinationFlows, mapping }: SingleFlowOperationParams): ProjectOperation {
    const destFlowId = mapping.findTargetId(fromFlow.id)
    const targetFlow = isNil(destFlowId) ? null : destinationFlows.find((f) => f.id === destFlowId)
    if (!targetFlow) {
        return {
            type: ProjectOperationType.CREATE_FLOW,
            flow: fromFlow,
        }
    }
    return {
        type: ProjectOperationType.UPDATE_FLOW,
        flow: fromFlow,
        targetFlow,
    }
}

function findFlowToDeleteOrUpdate({ fromFlows, destinationFlows, mapping }: DiffParams): ProjectOperation[] {
    return destinationFlows.map((flow) => {
        const sourceId = mapping.findSourceId(flow.id)
        const sourceFlow = fromFlows.find((f) => f.id === sourceId)
        if (!sourceFlow) {
            return {
                type: ProjectOperationType.DELETE_FLOW,
                flow,
            }
        }
        return null
    }).filter((f): f is ProjectOperation => f !== null)
}

function findFlowToCreate({ fromFlows, destinationFlows, mapping }: DiffParams): ProjectOperation[] {
    return fromFlows.map((flow) => createOrUpdateFlowOperation({ fromFlow: flow, destinationFlows, mapping }))
}


type DiffParams = {
    fromFlows: PopulatedFlow[]
    destinationFlows: PopulatedFlow[]
    mapping: ProjectMappingState
}

type SingleFlowOperationParams = {
    fromFlow: PopulatedFlow
    destinationFlows: PopulatedFlow[]
    mapping: ProjectMappingState
}