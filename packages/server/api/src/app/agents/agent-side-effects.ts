
import { ActivepiecesError, CreateTableWebhookRequest, ErrorCode, isNil, TableWebhookEventType } from '@activepieces/shared'
import { APArrayContains } from '../database/database-connection'
import { tableService, tableWebhookRepo } from '../tables/table/table.service'

export const agentSideEffects = () => ({
    async upsertTableWebhook(params: UpsertTableWebhookParams): Promise<void> {
        const { agentId, projectId, request } = params
        const table = await tableService.getOneByAgentId({ projectId, agentId })
        if (isNil(table)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'Table', entityId: agentId },
            })
        }
        
        const existingWebhook = await tableWebhookRepo().findOneBy({ 
            tableId: table.id, 
            ...APArrayContains('events', request.events),
        })
        if (isNil(existingWebhook)) {
            await tableService.createWebhook({
                projectId,
                id: table.id,
                request,
            })  
        }
    },
    async deleteTableWebhook(params: DeleteTableWebhookParams): Promise<void> {
        const { agentId, projectId, type } = params
        const table = await tableService.getOneByAgentId({ projectId, agentId })
        if (isNil(table)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'Table', entityId: agentId },
            })
        }
        const webhooks = await tableService.getWebhooks({
            projectId,
            id: table.id,
            events: [type],
        })
        if (webhooks.length === 0) {
            return
        }
        await tableService.deleteWebhook({
            projectId,
            id: table.id,
            webhookId: webhooks[0].id,
        })
    },
})

type UpsertTableWebhookParams = {
    agentId: string
    projectId: string
    request: Omit<CreateTableWebhookRequest, 'flowId'>
}

type DeleteTableWebhookParams = {
    agentId: string
    projectId: string
    type: TableWebhookEventType
}