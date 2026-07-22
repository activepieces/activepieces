import { chunk } from '@activepieces/core-utils'
import { PopulatedRecord, TableAutomationTrigger, TableWebhook, TableWebhookEventType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { WebhookFlowVersionToRun, webhookService } from '../../webhooks/webhook.service'
import { tableService } from '../table/table.service'

export const recordSideEffects = (_log: FastifyBaseLogger) => ({
    async handleRecordsEvent(
        params: BulkSideEffectParams,
        eventKey: keyof typeof EVENT_TYPE_MAP,
    ) {
        const { projectId, tableId, records, logger, authorization } = params
        if (records.length === 0) {
            return
        }
        const { eventType } = EVENT_TYPE_MAP[eventKey]

        const webhooks = params.webhooks ?? await tableService.getWebhooks({
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
    webhooks?: TableWebhook[]
}
