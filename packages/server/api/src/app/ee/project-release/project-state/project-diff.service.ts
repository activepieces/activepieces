import { ActionType, assertNotNullOrUndefined, ConnectionOperation, ConnectionOperationType, ConnectionState, DEFAULT_SAMPLE_DATA_SETTINGS, DiffState, FieldType, flowPieceUtil, flowStructureUtil, FlowVersion, isNil, PopulatedFlow, ProjectOperation, ProjectOperationType, ProjectState, Step, TableOperation, TableOperationType, TableState, TriggerType } from '@activepieces/shared'

export const projectDiffService = {
    diff({ newState, currentState }: DiffParams): DiffState {
        const createFlowOperation = findFlowsToCreate({ newState, currentState })
        const deleteFlowOperation = findFlowsToDelete({ newState, currentState })
        const updateFlowOperations = findFlowsToUpdate({ newState, currentState })
        const operations = [...deleteFlowOperation, ...createFlowOperation, ...updateFlowOperations]
        const connections = getFlowConnections(currentState, newState)
        const tables = getTables(currentState, newState)
        return {
            operations,
            connections,
            tables,
        }
    },
}

function findFlowsToCreate({ newState, currentState }: DiffParams): ProjectOperation[] {
    return newState.flows.filter((newFlow) => {
        const flow = searchInFlowForFlowByIdOrExternalId(currentState.flows, newFlow.externalId)
        return isNil(flow)
    }).map((flowState) => ({
        type: ProjectOperationType.CREATE_FLOW,
        flowState,
    }))
}
function findFlowsToDelete({ newState, currentState }: DiffParams): ProjectOperation[] {
    return currentState.flows.filter((currentFlowFromState) => {
        const flow = newState.flows.find((flowFromNewState) => currentFlowFromState.externalId === flowFromNewState.externalId)
        return isNil(flow)
    }).map((flowState) => ({
        type: ProjectOperationType.DELETE_FLOW,
        flowState,
    }))
}
function findFlowsToUpdate({ newState, currentState }: DiffParams): ProjectOperation[] {
    const newStateFiles = newState.flows.filter((state) => {
        const flow = searchInFlowForFlowByIdOrExternalId(currentState.flows, state.externalId)
        return !isNil(flow)
    })
    return newStateFiles.map((flowFromNewState) => {
        const os = searchInFlowForFlowByIdOrExternalId(currentState.flows, flowFromNewState.externalId)
        assertNotNullOrUndefined(os, `Could not find target flow for source flow ${flowFromNewState.externalId}`)
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

function isConnectionChanged(stateOne: ConnectionState, stateTwo: ConnectionState): boolean {
    return stateOne.displayName !== stateTwo.displayName || stateOne.pieceName !== stateTwo.pieceName
}

function isTableChanged(stateOne: TableState, stateTwo: TableState): boolean {
    const fieldsMetadataOne = stateOne.fields.map((field) => ({
        name: field.name,
        type: field.type,
        data: field.type === FieldType.STATIC_DROPDOWN ? field.data : undefined,
    }))
    const fieldsMetadataTwo = stateTwo.fields.map((field) => ({
        name: field.name,
        type: field.type,
        data: field.type === FieldType.STATIC_DROPDOWN ? field.data : undefined,
    }))
    return stateOne.name !== stateTwo.name || JSON.stringify(fieldsMetadataOne) !== JSON.stringify(fieldsMetadataTwo)
}

function getFlowConnections(currentState: ProjectState, newState: ProjectState): ConnectionOperation[] {

    const connectionOperations: ConnectionOperation[] = []

    currentState.connections?.forEach(connection => {
        const connectionState = newState.connections?.find((c) => c.externalId === connection.externalId)
        if (!isNil(connectionState) && isConnectionChanged(connectionState, connection)) {
            connectionOperations.push({
                type: ConnectionOperationType.UPDATE_CONNECTION,
                connectionState: connection,
                newConnectionState: connectionState,
            })
        }
    })

    newState.connections?.forEach(connection => {
        const isExistingConnection = currentState.connections?.find((c) => c.externalId === connection.externalId)
        if (isNil(isExistingConnection)) {
            connectionOperations.push({
                type: ConnectionOperationType.CREATE_CONNECTION,
                connectionState: connection,
            })
        }
    })

    return connectionOperations
}

function getTables(currentState: ProjectState, newState: ProjectState): TableOperation[] {
    const tableOperations: TableOperation[] = []

    currentState.tables?.forEach(table => {
        const tableState = newState.tables?.find((t) => t.externalId === table.externalId)
        if (!isNil(tableState) && isTableChanged(tableState, table)) {
            tableOperations.push({
                type: TableOperationType.UPDATE_TABLE,
                tableState: table,
                newTableState: tableState,
            })
        }
    })

    newState.tables?.forEach(table => {
        const isExistingTable = currentState.tables?.find((t) => t.externalId === table.externalId)
        if (isNil(isExistingTable)) {
            tableOperations.push({
                type: TableOperationType.CREATE_TABLE,
                tableState: table,
            })
        }
    })

    return tableOperations
}

function searchInFlowForFlowByIdOrExternalId(flows: PopulatedFlow[], externalId: string): PopulatedFlow | undefined {
    return flows.find((flow) =>  flow.externalId === externalId)
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
        connections?: ConnectionState[]
    }
    newState: ProjectState
}

