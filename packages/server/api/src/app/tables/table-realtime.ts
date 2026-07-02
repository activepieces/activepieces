import { tryCatchSync } from '@activepieces/core-utils'
import { Field, PopulatedRecord, WebsocketClientEvent } from '@activepieces/shared'
import { websocketService } from '../core/websockets.service'

const emit = (projectId: string, event: WebsocketClientEvent, payload: unknown): void => {
    // Best-effort broadcast: a socket/startup hiccup must never break the mutation.
    tryCatchSync(() => websocketService.to(projectId).emit(event, payload))
}

export const tableRealtime = {
    recordCreated({ projectId, tableId, record }: RecordEventParams): void {
        emit(projectId, WebsocketClientEvent.TABLE_RECORD_CREATED, { projectId, tableId, record })
    },
    recordUpdated({ projectId, tableId, record }: RecordEventParams): void {
        emit(projectId, WebsocketClientEvent.TABLE_RECORD_UPDATED, { projectId, tableId, record })
    },
    recordDeleted({ projectId, tableId, recordId }: RecordDeletedParams): void {
        emit(projectId, WebsocketClientEvent.TABLE_RECORD_DELETED, { projectId, tableId, recordId })
    },
    fieldCreated({ projectId, tableId, field }: FieldEventParams): void {
        emit(projectId, WebsocketClientEvent.TABLE_FIELD_CREATED, { projectId, tableId, field })
    },
    fieldUpdated({ projectId, tableId, field }: FieldEventParams): void {
        emit(projectId, WebsocketClientEvent.TABLE_FIELD_UPDATED, { projectId, tableId, field })
    },
    fieldDeleted({ projectId, tableId, fieldId }: FieldDeletedParams): void {
        emit(projectId, WebsocketClientEvent.TABLE_FIELD_DELETED, { projectId, tableId, fieldId })
    },
}

type RecordEventParams = {
    projectId: string
    tableId: string
    record: PopulatedRecord
}

type RecordDeletedParams = {
    projectId: string
    tableId: string
    recordId: string
}

type FieldEventParams = {
    projectId: string
    tableId: string
    field: Field
}

type FieldDeletedParams = {
    projectId: string
    tableId: string
    fieldId: string
}
