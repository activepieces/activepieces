import { isNil, tryCatch } from '@activepieces/core-utils'
import { PopulatedRecord, TableRecordsChangedEvent, TableRecordsChangeOp, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

const MAX_RECORDS_PER_PUSH = 50

export const tableRoom = (log: FastifyBaseLogger) => ({
    name: tableRoomName,
    async notifyChanged({ tableId, change, editorSessionId }: NotifyChangedParams): Promise<void> {
        const event = buildChangedEvent({ tableId, change, editorSessionId })
        if (isNil(event)) {
            return
        }
        const { error } = await tryCatch(async () => {
            const { websocketService } = await import('../../core/websockets.service')
            websocketService.to(tableRoomName(tableId)).emit(WebsocketClientEvent.TABLE_RECORDS_CHANGED, event)
        })
        if (!isNil(error)) {
            log.error({ error, table: { id: tableId } }, '[tableRoom#notifyChanged] Could not send the table change, the write is kept')
        }
    },
})

function tableRoomName(tableId: string): string {
    return `table:${tableId}`
}

function buildChangedEvent({ tableId, change, editorSessionId }: NotifyChangedParams): TableRecordsChangedEvent | null {
    const base = { tableId, editorSessionId }
    switch (change.op) {
        case TableRecordsChangeOp.CLEARED:
            return { ...base, op: TableRecordsChangeOp.CLEARED }
        case TableRecordsChangeOp.FIELDS_CHANGED:
            return { ...base, op: TableRecordsChangeOp.FIELDS_CHANGED }
        case TableRecordsChangeOp.TABLE_UPDATED:
            return { ...base, op: TableRecordsChangeOp.TABLE_UPDATED }
        case TableRecordsChangeOp.TABLE_DELETED:
            return { ...base, op: TableRecordsChangeOp.TABLE_DELETED }
        case TableRecordsChangeOp.DELETED:
            return withinPushCap({ tableId, editorSessionId, count: change.recordIds.length, event: { ...base, op: TableRecordsChangeOp.DELETED, recordIds: change.recordIds } })
        case TableRecordsChangeOp.CREATED:
            return withinPushCap({ tableId, editorSessionId, count: change.records.length, event: { ...base, op: TableRecordsChangeOp.CREATED, records: change.records } })
        case TableRecordsChangeOp.UPDATED:
            return withinPushCap({ tableId, editorSessionId, count: change.records.length, event: { ...base, op: TableRecordsChangeOp.UPDATED, records: change.records } })
    }
}

function withinPushCap({ tableId, editorSessionId, count, event }: WithinPushCapParams): TableRecordsChangedEvent | null {
    if (count === 0) {
        return null
    }
    if (count > MAX_RECORDS_PER_PUSH) {
        return { tableId, editorSessionId, op: TableRecordsChangeOp.RELOAD }
    }
    return event
}

export type TableChange = {
    op: TableRecordsChangeOp.CREATED | TableRecordsChangeOp.UPDATED
    records: PopulatedRecord[]
} | {
    op: TableRecordsChangeOp.DELETED
    recordIds: string[]
} | {
    op: TableRecordsChangeOp.CLEARED | TableRecordsChangeOp.FIELDS_CHANGED | TableRecordsChangeOp.TABLE_UPDATED | TableRecordsChangeOp.TABLE_DELETED
}

type NotifyChangedParams = {
    tableId: string
    change: TableChange
    editorSessionId: string | null
}

type WithinPushCapParams = {
    tableId: string
    editorSessionId: string | null
    count: number
    event: TableRecordsChangedEvent
}
