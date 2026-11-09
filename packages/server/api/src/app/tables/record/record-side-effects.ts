import { chunk, isNil, tryCatch } from '@activepieces/core-utils'
import { PopulatedRecord, TableAutomationTrigger, TableRecordsChangedEvent, TableRecordsChangeOp, TableWebhookEventType, WebsocketClientEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { WebhookFlowVersionToRun, webhookService } from '../../webhooks/webhook.service'
import { tableService } from '../table/table.service'
import { MAX_BATCH_SIZE } from './record.service'

export const recordSideEffects = (log: FastifyBaseLogger) => ({
    async onRecordsChanged({ projectId, tableId, change, editorSessionId }: OnRecordsChangedParams): Promise<void> {
        const event = buildRecordsChangedEvent({ tableId, change, editorSessionId })
        if (isNil(event)) {
            return
        }
        const { error } = await tryCatch(async () => {
            const { websocketService } = await import('../../core/websockets.service')
            websocketService.to(projectId).emit(WebsocketClientEvent.TABLE_RECORDS_CHANGED, event)
        })
        if (!isNil(error)) {
            log.error({ error, table: { id: tableId }, project: { id: projectId } }, '[recordSideEffects#onRecordsChanged] Could not send the records change, the write is kept')
        }
    },
    async handleRecordsEvent(
        params: BulkSideEffectParams,
        eventKey: keyof typeof EVENT_TYPE_MAP,
    ) {
        const { projectId, tableId, records, logger, authorization } = params
        if (records.length === 0) {
            return
        }
        const { eventType } = EVENT_TYPE_MAP[eventKey]

        const webhooks = await tableService.getWebhooks({
            projectId,
            id: tableId,
            events: [eventType],
        })
        if (webhooks.length === 0) {
            return
        }

        const dispatches = records.flatMap((record) =>
            webhooks.map((webhook) => ({ record, webhook })),
        )
        for (const batch of chunk(dispatches, MAX_CONCURRENT_WEBHOOK_DISPATCHES)) {
            await Promise.all(batch.map(({ record, webhook }) =>
                webhookService.handleWebhook({
                    async: true,
                    flowId: webhook.flowId,
                    flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
                    saveSampleData: false,
                    data: async (_projectId: string) => ({
                        method: 'POST',
                        headers: {
                            authorization,
                        },
                        body: { record },
                        queryParams: {},
                    }),
                    execute: true,
                    logger,
                    failParentOnFailure: true,
                }),
            ))
        }
    },
})

function buildRecordsChangedEvent({ tableId, change, editorSessionId }: BuildRecordsChangedEventParams): TableRecordsChangedEvent | null {
    const base = { tableId, ...(isNil(editorSessionId) ? {} : { editorSessionId }) }
    switch (change.op) {
        case TableRecordsChangeOp.CLEARED:
            return { ...base, op: TableRecordsChangeOp.CLEARED }
        case TableRecordsChangeOp.DELETED:
            return withinCap({ base, count: change.recordIds.length, event: { ...base, op: TableRecordsChangeOp.DELETED, recordIds: change.recordIds } })
        case TableRecordsChangeOp.CREATED:
        case TableRecordsChangeOp.UPDATED:
            return withinCap({ base, count: change.records.length, event: { ...base, op: change.op, records: change.records } })
    }
}

function withinCap({ base, count, event }: WithinCapParams): TableRecordsChangedEvent | null {
    if (count === 0) {
        return null
    }
    if (count > MAX_BATCH_SIZE) {
        return { ...base, op: TableRecordsChangeOp.RELOAD }
    }
    return event
}

const MAX_CONCURRENT_WEBHOOK_DISPATCHES = 50

const EVENT_TYPE_MAP: Record<
'created' | 'updated' | 'deleted',
EventTypeWithAutomation
> = {
    created: {
        eventType: TableWebhookEventType.RECORD_CREATED,
        automationTrigger: TableAutomationTrigger.ON_NEW_RECORD,
    },
    updated: {
        eventType: TableWebhookEventType.RECORD_UPDATED,
        automationTrigger: TableAutomationTrigger.ON_UPDATE_RECORD,
    },
    deleted: {
        eventType: TableWebhookEventType.RECORD_DELETED,
    },
}

type EventTypeWithAutomation = {
    eventType: TableWebhookEventType
    automationTrigger?: TableAutomationTrigger
}

type BulkSideEffectParams = {
    projectId: string
    tableId: string
    records: PopulatedRecord[]
    logger: FastifyBaseLogger
    authorization: string
    agentUpdate?: boolean
}

type OnRecordsChangedParams = {
    projectId: string
    tableId: string
    change: RecordsChange
    editorSessionId: string | null
}

type BuildRecordsChangedEventParams = Omit<OnRecordsChangedParams, 'projectId'>

type RecordsChange = {
    op: TableRecordsChangeOp.CREATED | TableRecordsChangeOp.UPDATED
    records: PopulatedRecord[]
} | {
    op: TableRecordsChangeOp.DELETED
    recordIds: string[]
} | {
    op: TableRecordsChangeOp.CLEARED
}

type WithinCapParams = {
    base: Pick<TableRecordsChangedEvent, 'tableId' | 'editorSessionId'>
    count: number
    event: TableRecordsChangedEvent
}
