import { isNil, tryCatch } from '@activepieces/core-utils'
import { PopulatedRecord, TableRecordsChangedEvent, TableRecordsChangeOp, WebsocketClientEvent } from '@activepieces/shared'
import { system } from '../../helper/system/system'

const MAX_RECORDS_PER_PUSH = 50

export const tableRoom = {
    name: (tableId: string): string => `table:${tableId}`,
    async notifyChanged({ tableId, change, editorSessionId }: NotifyChangedParams): Promise<void> {
        const event = buildChangedEvent({ tableId, change, editorSessionId })
        if (isNil(event)) {
            return
        }
        const { error } = await tryCatch(async () => {
            const { websocketService } = await import('../../core/websockets.service')
            websocketService.to(tableRoom.name(tableId)).emit(WebsocketClientEvent.TABLE_RECORDS_CHANGED, event)
        })
        if (!isNil(error)) {
            system.globalLogger().error({ error, table: { id: tableId } }, '[tableRoom#notifyChanged] Could not send the table change, the write is kept')
        }
    },
}

function buildChangedEvent({ tableId, change, editorSessionId }: NotifyChangedParams): TableRecordsChangedEvent | null {
    const base = { tableId, editorSessionId }
    switch (change.op) {
        case TableRecordsChangeOp.CLEARED:
            return { ...base, op: TableRecordsChangeOp.CLEARED }
        case TableRecordsChangeOp.FIELDS_CHANGED:
            return { ...base, op: TableRecordsChangeOp.FIELDS_CHANGED }
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
    op: TableRecordsChangeOp.CLEARED | TableRecordsChangeOp.FIELDS_CHANGED
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
