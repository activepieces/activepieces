import { isNil, ProjectState, TableOperation, TableOperationType, TableState } from '@activepieces/shared'

export const tableDiffService = {
    diff({ newState, currentState }: DiffParams): TableOperation[] {
        const updates = findTablesToUpdate(currentState, newState)
        const creates = findTablesToCreate(currentState, newState)
        const deletes = findTablesToDelete(currentState, newState)
        return [...updates, ...creates, ...deletes]
    },
}

function isTableChanged(stateOne: TableState, stateTwo: TableState): boolean {
    const serialize = (t: TableState): string => JSON.stringify({
        name: t.name,
        externalId: t.externalId,
        fields: t.fields,
        status: t.status,
        trigger: t.trigger,
    })
    return serialize(stateOne) !== serialize(stateTwo)
}

function findTablesToUpdate(currentState: ProjectState, newState: ProjectState): TableOperation[] {
    if (!currentState.tables || !newState.tables) return []
    const operations: TableOperation[] = []
    currentState.tables.forEach(table => {
        const newTable = newState.tables?.find((t) => t.externalId === table.externalId)
        if (!isNil(newTable) && isTableChanged(newTable, table)) {
            operations.push({
                type: TableOperationType.UPDATE_TABLE,
                tableState: table,
                newTableState: newTable,
            })
        }
    })
    return operations
}

function findTablesToCreate(currentState: ProjectState, newState: ProjectState): TableOperation[] {
    if (!newState.tables) return []
    const operations: TableOperation[] = []
    newState.tables.forEach(table => {
        const exists = currentState.tables?.find((t) => t.externalId === table.externalId)
        if (isNil(exists)) {
            operations.push({
                type: TableOperationType.CREATE_TABLE,
                tableState: table,
            })
        }
    })
    return operations
}

function findTablesToDelete(currentState: ProjectState, newState: ProjectState): TableOperation[] {
    if (!currentState.tables) return []
    const operations: TableOperation[] = []
    currentState.tables.forEach(table => {
        const exists = newState.tables?.find((t) => t.externalId === table.externalId)
        if (isNil(exists)) {
            operations.push({
                type: TableOperationType.DELETE_TABLE,
                tableState: table,
            })
        }
    })
    return operations
}

type DiffParams = {
    currentState: ProjectState
    newState: ProjectState
} 