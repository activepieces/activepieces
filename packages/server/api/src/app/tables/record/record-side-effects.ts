import { PopulatedRecord, TableAutomationStatus, TableAutomationTrigger, TableWebhookEventType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { tableAutomationService } from '../../ee/tables/table-automation-service'
import { tableService } from '../table/table.service'
import { recordService } from './record.service'

type BulkSideEffectParams = {
    projectId: string
    tableId: string
    records: PopulatedRecord[]
    logger: FastifyBaseLogger
    authorization: string
    agentUpdate?: boolean
}

  type EventTypeWithAutomation = {
      eventType: TableWebhookEventType
      automationTrigger?: TableAutomationTrigger
  }

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


export const recordSideEffects = (log: FastifyBaseLogger) => ({
    async handleRecordsEvent(
        params: BulkSideEffectParams,
        eventKey: keyof typeof EVENT_TYPE_MAP,
    ) {
        const { projectId, tableId, records, logger, authorization, agentUpdate } = params
        const { eventType, automationTrigger } = EVENT_TYPE_MAP[eventKey]

        await Promise.all(
            records.map(async (record) => {
                await recordService.triggerWebhooks({
                    projectId,
                    tableId,
                    eventType,
                    data: { record },
                    logger,
                    authorization,
                })
                if (automationTrigger && !agentUpdate) {
                    const table = await tableService.getOneOrThrow({ projectId, id: tableId })
                    if (table.agent && table.status === TableAutomationStatus.ENABLED && table.trigger === automationTrigger) {
                        await tableAutomationService(log).run({
                            table,
                            record,
                            projectId,
                            trigger: automationTrigger,
                        })
                    }
                }
            }),
        )
    },
})