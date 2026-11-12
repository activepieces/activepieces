import { isNil, tryCatch } from '@activepieces/core-utils'
import { TableUpdatedEvent, WebsocketClientEvent } from '@activepieces/shared'
import { system } from '../../helper/system/system'

export const tableSideEffects = {
    async onTableChanged({ projectId, tableId, editorSessionId }: OnTableChangedParams): Promise<void> {
        const { error } = await tryCatch(async () => {
            const { websocketService } = await import('../../core/websockets.service')
            const event: TableUpdatedEvent = { tableId, editorSessionId: editorSessionId ?? null }
            websocketService.to(projectId).emit(WebsocketClientEvent.TABLE_UPDATED, event)
        })
        if (!isNil(error)) {
            system.globalLogger().error({ error, table: { id: tableId }, project: { id: projectId } }, '[tableSideEffects#onTableChanged] Could not send the table update, the write is kept')
        }
    },
}

type OnTableChangedParams = {
    projectId: string
    tableId: string
    editorSessionId?: string | null
}
