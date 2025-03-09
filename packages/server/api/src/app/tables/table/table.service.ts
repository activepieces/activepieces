import {
    ActivepiecesError,
    apId,
    CreateTableRequest,
    CreateTableWebhookRequest,
    ErrorCode,
    ExportTableResponse,
    isNil,
    Table,
    TableWebhook,
    TableWebhookEventType,
    UpdateTableRequest,
} from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { fieldService } from '../field/field.service'
import { RecordEntity } from '../record/record.entity'
import { TableWebhookEntity } from './table-webhook.entity'
import { TableEntity } from './table.entity'

const tableRepo = repoFactory(TableEntity)
const recordRepo = repoFactory(RecordEntity)
const tableWebhookRepo = repoFactory(TableWebhookEntity)

export const tableService = {
    async create({
        projectId,
        request,
    }: {
        projectId: string
        request: CreateTableRequest
    }): Promise<Table> {
        const table = await tableRepo().save({
            id: apId(),
            name: request.name,
            projectId,
        })

        return table
    },

    async getAll({ projectId }: { projectId: string }): Promise<Table[]> {
        return tableRepo().find({
            where: { projectId },
        })
    },

    async getById({
        projectId,
        id,
    }: {
        projectId: string
        id: string
    }): Promise<Table> {
        const table = await tableRepo().findOne({
            where: { projectId, id },
        })

        if (isNil(table)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'Table',
                    entityId: id,
                },
            })
        }

        return table
    },

    async delete({
        projectId,
        id,
    }: {
        projectId: string
        id: string
    }): Promise<void> {
        await tableRepo().delete({
            projectId,
            id,
        })
    },

    async exportTable({
        projectId,
        id,
    }: {
        projectId: string
        id: string
    }): Promise<ExportTableResponse> {
        await this.getById({ projectId, id })

        // TODO: Change field sorting to use position when it's added
        const fields = await fieldService.getAll({ projectId, tableId: id })

        const records = await recordRepo().find({
            where: { tableId: id, projectId },
            relations: ['cells'],
        })

        const rows = records.map((record) => {
            const row: Record<string, string> = {}
            for (const field of fields) {
                const cell = record.cells.find((c) => c.fieldId === field.id)
                row[field.name] = cell?.value?.toString() ?? ''
            }
            return row
        })

        return {
            fields: fields.map((f) => ({ id: f.id, name: f.name })),
            rows,
        }
    },

    async createWebhook({
        projectId,
        id,
        request,
    }: {
        projectId: string
        id: string
        request: CreateTableWebhookRequest
    }): Promise<TableWebhook> {
        return tableWebhookRepo().save({
            id: apId(),
            projectId,
            tableId: id,
            ...request,
        })
    },

    async deleteWebhook({
        projectId,
        id,
        webhookId,
    }: {
        projectId: string
        id: string
        webhookId: string
    }): Promise<void> {
        await tableWebhookRepo().delete({
            projectId,
            tableId: id,
            id: webhookId,
        })
    },

    async getWebhooks({
        projectId,
        id,
        eventType,
    }: {
        projectId: string
        id: string
        eventType: TableWebhookEventType
    }): Promise<TableWebhook[]> {
        return tableWebhookRepo().find({
            where: { projectId, tableId: id, eventType },
        })
    },

    async update({
        projectId,
        id,
        request,
    }: {
        projectId: string
        id: string
        request: UpdateTableRequest
    }): Promise<Table> {
        await tableRepo().update({
            id,
            projectId
        }, {
            name: request.name,
        })
        return this.getById({ projectId, id })
    }

    
}
