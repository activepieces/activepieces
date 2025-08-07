import {
    ActivepiecesError,
    apId,
    CreateTableRequest,
    CreateTableWebhookRequest,
    ErrorCode,
    ExportTableResponse,
    isNil,
    PlatformUsageMetric,
    SeekPage,
    spreadIfDefined,
    Table,
    TableWebhook,
    TableWebhookEventType,
    UpdateTableRequest,
} from '@activepieces/shared'
import { ILike, In } from 'typeorm'
import { agentsService } from '../../agents/agents-service'
import { repoFactory } from '../../core/db/repo-factory'
import { APArrayContains } from '../../database/database-connection'
import { PlatformPlanHelper } from '../../ee/platform/platform-plan/platform-plan-helper'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { fieldService } from '../field/field.service'
import { RecordEntity } from '../record/record.entity'
import { TableWebhookEntity } from './table-webhook.entity'
import { TableEntity } from './table.entity'

export const tableRepo = repoFactory(TableEntity)
const recordRepo = repoFactory(RecordEntity)
const tableWebhookRepo = repoFactory(TableWebhookEntity)

export const tableService = {
    async create({
        projectId,
        request,
    }: CreateParams): Promise<Table> {

        const platformId = await projectService.getPlatformId(projectId)
        await PlatformPlanHelper.checkQuotaOrThrow({
            platformId,
            projectId,
            metric: PlatformUsageMetric.TABLES,
        })

        const table = await tableRepo().save({
            id: apId(),
            externalId: request.externalId ?? apId(),
            name: request.name,
            projectId,
        })
        return table
    },
    async getAllAgentIds({ projectId }: GetAllAgentIdsParams): Promise<string[]> {
        const tables = await tableRepo().find({
            where: { projectId },
            select: ['agentId'],
        })
        return tables.map((table) => table.agentId)
    },
    async list({ projectId, cursor, limit, name, externalIds }: ListParams): Promise<SeekPage<Table>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor ?? null)

        const paginator = buildPaginator({
            entity: TableEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const queryWhere: Record<string, unknown> = { projectId }
        if (!isNil(name)) {
            queryWhere.name = ILike(`%${name}%`)
        }
        if (!isNil(externalIds)) {
            queryWhere.externalId = In(externalIds)
        }
        const paginationResult = await paginator.paginate(
            tableRepo().createQueryBuilder('table').where(queryWhere),
        )

        return paginationHelper.createPage(paginationResult.data, paginationResult.cursor)
    },

    async getOneOrThrow({
        projectId,
        id,
    }: GetByIdParams): Promise<Table> {
        await ensureAgentExists({ tableId: id, projectId })
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
        return {
            ...table,
            agent: await agentsService(system.globalLogger()).getOneOrThrow({
                id: table.agentId,
                projectId,
            }),
        }
    },

    async delete({
        projectId,
        id,
    }: DeleteParams): Promise<void> {
        await tableRepo().delete({
            projectId,
            id,
        })
    },

    async exportTable({
        projectId,
        id,
    }: ExportTableParams): Promise<ExportTableResponse> {
        const table = await this.getOneOrThrow({ projectId, id })

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
            name: table.name,
        }
    },

    async createWebhook({
        projectId,
        id,
        request,
    }: CreateWebhookParams): Promise<TableWebhook> {
        return tableWebhookRepo().save({
            id: apId(),
            projectId,
            tableId: id,
            events: request.events,
            flowId: request.flowId,
        })
    },

    async deleteWebhook({
        projectId,
        id,
        webhookId,
    }: DeleteWebhookParams): Promise<void> {
        await tableWebhookRepo().delete({
            projectId,
            tableId: id,
            id: webhookId,
        })
    },

    async getWebhooks({
        projectId,
        id,
        events,
    }: GetWebhooksParams): Promise<TableWebhook[]> {
        return tableWebhookRepo().find({
            where: { projectId, tableId: id, ...APArrayContains('events', events) },
        })
    },

    async update({
        projectId,
        id,
        request,
    }: UpdateParams): Promise<Table> {
        await tableRepo().update({ id, projectId }, { 
            ...spreadIfDefined('name', request.name),
            ...spreadIfDefined('trigger', request.trigger),
            ...spreadIfDefined('status', request.status),
        })
        return this.getOneOrThrow({ projectId, id })
    },
    async count({ projectId }: CountParams): Promise<number> {
        return tableRepo().count({
            where: { projectId },
        })
    },

}

type GetAllAgentIdsParams = {
    projectId: string
}

async function ensureAgentExists({ tableId, projectId }: EnsureAgentExistsParams): Promise<void> {
    const table = await tableRepo().findOneBy({
        id: tableId,
        projectId,
    })
    if (isNil(table) || !isNil(table.agentId)) {
        return
    }
    const platformId = await projectService.getPlatformId(projectId)
    const agent = await agentsService(system.globalLogger()).create({
        projectId,
        displayName: `${table.name} Agent`,
        systemPrompt: '',
        description: '',
        platformId,
    })
    await tableRepo().update({ id: tableId, projectId }, { agentId: agent.id })
}

type EnsureAgentExistsParams = {
    tableId: string
    projectId: string
}

type CreateParams = {
    projectId: string
    request: CreateTableRequest
}

type ListParams = {
    projectId: string
    cursor: string | undefined
    limit: number
    name: string | undefined
    externalIds: string[] | undefined
}

type GetByIdParams = {
    projectId: string
    id: string
}

type DeleteParams = {
    projectId: string
    id: string
}

type ExportTableParams = {
    projectId: string
    id: string
}

type CreateWebhookParams = {
    projectId: string
    id: string
    request: CreateTableWebhookRequest
}

type DeleteWebhookParams = {
    projectId: string
    id: string
    webhookId: string
}

type GetWebhooksParams = {
    projectId: string
    id: string
    events: TableWebhookEventType[]
}

type UpdateParams = {
    projectId: string
    id: string
    request: UpdateTableRequest
}

type CountParams = {
    projectId: string
}
