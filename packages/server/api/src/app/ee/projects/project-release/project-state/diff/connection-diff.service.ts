import { ConnectionOperation, ConnectionOperationType, isNil, ProjectState } from '@activepieces/shared'

export const connectionDiffService = {
    diff({ newState, currentState }: DiffParams): ConnectionOperation[] {
        const connectionOperations: ConnectionOperation[] = []

        currentState.connections?.forEach(connection => {
            const connectionState = newState.connections?.find((c) => c.externalId === connection.externalId)
            const connectionChanged =  connectionState?.pieceName !== connection.pieceName
            if (!isNil(connectionState) && connectionChanged) {
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
    },
}

type DiffParams = {
    currentState: ProjectState
    newState: ProjectState
} 