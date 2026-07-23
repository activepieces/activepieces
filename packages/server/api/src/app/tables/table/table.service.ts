import { Readable } from 'node:stream'
import { ActivepiecesError, apId, ErrorCode, isNil, SeekPage, spreadIfDefined } from '@activepieces/core-utils'
import { CreateTableRequest, CreateTableWebhookRequest, ExportTableResponse, Field, FileCompression, FileType, PopulatedTable, SharedTemplate, Table, TableDataState, TableImportDataType, TableTemplate, TableWebhook, TableWebhookEventType, TemplateStatus, TemplateType, UncategorizedFolderId, UpdateTableRequest, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ArrayContains, ILike, In, IsNull } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { projectStateService } from '../../ee/projects/project-release/project-state/project-state.service'
import { fileService } from '../../file/file.service'
import { enforceByteLimit, filesService } from '../../file/files-service'
import { getFolderIdFromRequest } from '../../flows/flow/flow.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { fieldService } from '../field/field.service'
import { CellEntity } from '../record/cell.entity'
import { RecordEntity, RecordSchema } from '../record/record.entity'
import { TableWebhookEntity } from './table-webhook.entity'
import { TableEntity } from './table.entity'

export const tableRepo = repoFactory(TableEntity)
export const recordRepo = repoFactory(RecordEntity)
const cellRepo = repoFactory(CellEntity)
const tableWebhookRepo = repoFactory(TableWebhookEntity)
const tablePieceName = '@activepieces/piece-tables'

export const tableService = {
    async create({
        projectId,
        request,
    }: CreateParams): Promise<Table> {
        const folderId = await getFolderIdFromRequest({ projectId, folderId: request.folderId, folderName: request.folderName, log: system.globalLogger() })
        const table = await tableRepo().save({
            id: apId(),
            externalId: request.externalId ?? apId(),
            name: request.name,
            projectId,
            folderId,
        })
        if (request.fields) {
            for (const field of request.fields) {
                await fieldService.createFromState({ projectId, field, tableId: table.id })
            }
        }
        return table
    },
    async list({ projectId, cursor, limit, name, externalIds, folderId, folderIds, includeRowCount }: ListParams): Promise<SeekPage<Table & { rowCount?: number }>> {
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

        if (!isNil(folderId)) {
            queryWhere.folderId = folderId === UncategorizedFolderId ? IsNull() : folderId
        }

        if (!isNil(folderIds)) {
            queryWhere.folderId = In(folderIds)
        }

        const queryBuilder = tableRepo().createQueryBuilder('table').where(queryWhere)

        if (includeRowCount) {
            queryBuilder.addSelect((subQuery) => {
                return subQuery
                    .select('COUNT(*)::int', 'rowCount')
                    .from('record', 'record')
                    .where('record."tableId" = table.id')
            }, 'rowCount')
        }

        const paginationResult = await paginator.paginate<Table & { rowCount?: number }>(queryBuilder)

        return paginationHelper.createPage(paginationResult.data, paginationResult.cursor)
    },

    async getOneOrThrow({
        projectId,
        id,
    }: GetByIdParams): Promise<Table> {
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

    async getOneByExternalIdOrThrow({
        projectId,
        externalId,
    }: GetOneByExternalIdParams): Promise<Table> {
        const table = await tableRepo().findOneBy({ projectId, externalId })
        if (isNil(table)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'Table',
                    entityId: externalId,
                },
            })
        }
        return table
    },

    async getTemplate({
        tableId,
        userMetadata,
        projectId,
        log,
    }: GetTemplateParams): Promise<SharedTemplate> {
        const table = await this.getOneOrThrow({
            id: tableId,
            projectId,
        })

        const fields = await fieldService.getAll({ projectId, tableId })

        const populatedTable: PopulatedTable = {
            ...table,
            fields,
        }

        const tableState = projectStateService(log).getTableState(populatedTable)

        const records = await recordRepo().find({
            where: { tableId: table.id, projectId },
            relations: ['cells'],
        })

        const rows: TableDataState['rows'] = records.map((record) => {
            const row: { fieldId: string, value: string }[] = []
            for (const field of fields) {
                const cell = record.cells.find((c) => c.fieldId === field.id)
                row.push({
                    fieldId: field.externalId,
                    value: cell?.value?.toString() ?? '',
                })
            }
            return row
        })

        const tableTemplate: TableTemplate = {
            ...tableState,
            data: {
                type: TableImportDataType.CSV,
                rows,
            },
        }

        const template: SharedTemplate = {
            name: table.name,
            summary: '',
            description: '',
            pieces: [tablePieceName],
            tables: [tableTemplate],
            tags: [],
            blogUrl: '',
            metadata: {
                externalId: table.externalId,
            },
            author: userMetadata ? `${userMetadata.firstName} ${userMetadata.lastName}` : '',
            categories: [],
            type: TemplateType.SHARED,
            status: TemplateStatus.PUBLISHED,
        }
        return template
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

    async exportTableCsvToFile({
        projectId,
        platformId,
        id,
        includeHeaders,
        log,
    }: ExportTableCsvToFileParams): Promise<ExportTableCsvToFileResult> {
        const table = await this.getOneOrThrow({ projectId, id })
        const fields = await fieldService.getAll({ projectId, tableId: id })
        const fieldIds = fields.map((field) => field.id)

        let rowCount = 0
        async function* generateRows(): AsyncGenerator<string> {
            let isFirstLine = true
            if (includeHeaders) {
                yield fields.map((field) => escapeCsvCell(field.name)).join(',')
                isFirstLine = false
            }
            let afterCursor: string | undefined
            for (;;) {
                const { records, nextCursor } = await fetchRecordPage({ tableId: id, projectId, afterCursor })
                if (records.length === 0) {
                    break
                }
                const cellsByRecord = await fetchCellsByRecord({
                    projectId,
                    fieldIds,
                    recordIds: records.map((record) => record.id),
                })
                for (const record of records) {
                    const line = buildCsvRow(fields, cellsByRecord.get(record.id))
                    yield isFirstLine ? line : `\n${line}`
                    isFirstLine = false
                    rowCount++
                }
                if (isNil(nextCursor)) {
                    break
                }
                afterCursor = nextCursor
            }
        }

        const maxFileSizeInBytes = system.getNumberOrThrow(AppSystemProp.MAX_FILE_SIZE_MB) * 1024 * 1024
        const file = await fileService(log).save({
            projectId,
            platformId,
            type: FileType.FLOW_STEP_FILE,
            fileName: `${table.name}.csv`,
            data: Readable.from(generateRows(), { objectMode: false }).pipe(enforceByteLimit(maxFileSizeInBytes)),
            compression: FileCompression.NONE,
            metadata: { mimetype: 'text/csv' },
        })
        const url = await filesService.constructReadUrl({
            fileId: file.id,
            fileType: FileType.FLOW_STEP_FILE,
            platformId,
        })
        return { url, name: `${table.name}.csv`, rowCount }
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
            where: { projectId, tableId: id, events: ArrayContains(events) },
        })
    },

    async update({
        projectId,
        id,
        request,
    }: UpdateParams): Promise<Table> {

        const updateData: Record<string, unknown> = {
            ...spreadIfDefined('name', request.name),
            ...spreadIfDefined('trigger', request.trigger),
            ...spreadIfDefined('status', request.status),
            folderId: request.folderId,
        }

        await tableRepo().update({ id, projectId }, updateData)
        return this.getOneOrThrow({ projectId, id })
    },
    async count({ projectId, folderId }: CountParams): Promise<number> {
        const where: Record<string, unknown> = { projectId }
        if (!isNil(folderId)) {
            where.folderId = folderId === UncategorizedFolderId ? null : folderId
        }
        return tableRepo().count({ where })
    },

}

const EXPORT_BATCH_SIZE = 2000

const CELL_EDGE_CHARS = /^[\s\u0000-\u001F\u007F-\u009F]+|[\s\u0000-\u001F\u007F-\u009F]+$/g

async function fetchRecordPage({ tableId, projectId, afterCursor }: FetchRecordPageParams): Promise<FetchRecordPageResult> {
    const paginator = buildPaginator({
        entity: RecordEntity,
        alias: 'record',
        query: {
            limit: EXPORT_BATCH_SIZE,
            orderBy: [
                { field: 'id', order: Order.ASC },
            ],
            afterCursor,
        },
    })
    const queryBuilder = recordRepo().createQueryBuilder('record').where({ tableId, projectId })
    const { data, cursor } = await paginator.paginate<RecordSchema>(queryBuilder)
    return { records: data, nextCursor: cursor.afterCursor }
}

async function fetchCellsByRecord({ projectId, fieldIds, recordIds }: FetchCellsByRecordParams): Promise<Map<string, Map<string, string>>> {
    if (fieldIds.length === 0) {
        return new Map()
    }
    const cells = await cellRepo().find({
        where: { projectId, fieldId: In(fieldIds), recordId: In(recordIds) },
    })
    const cellsByRecord = new Map<string, Map<string, string>>()
    for (const cell of cells) {
        const row = cellsByRecord.get(cell.recordId) ?? new Map<string, string>()
        row.set(cell.fieldId, cell.value?.toString() ?? '')
        cellsByRecord.set(cell.recordId, row)
    }
    return cellsByRecord
}

function buildCsvRow(fields: Field[], valueByFieldId: Map<string, string> | undefined): string {
    return fields
        .map((field) => escapeCsvCell(trimCellEdges(valueByFieldId?.get(field.id) ?? '')))
        .join(',')
}

function escapeCsvCell(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

function trimCellEdges(value: string): string {
    return value.replace(CELL_EDGE_CHARS, '')
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
    folderId: string | undefined
    folderIds?: string[] | undefined
    includeRowCount?: boolean
}

type GetByIdParams = {
    projectId: string
    id: string
}

type GetOneByExternalIdParams = {
    projectId: string
    externalId: string
}

type DeleteParams = {
    projectId: string
    id: string
}

type ExportTableParams = {
    projectId: string
    id: string
}

type ExportTableCsvToFileParams = {
    projectId: string
    platformId: string
    id: string
    includeHeaders: boolean
    log: FastifyBaseLogger
}

type ExportTableCsvToFileResult = {
    url: string
    name: string
    rowCount: number
}

type FetchRecordPageParams = {
    tableId: string
    projectId: string
    afterCursor: string | undefined
}

type FetchRecordPageResult = {
    records: RecordSchema[]
    nextCursor: string | null
}

type FetchCellsByRecordParams = {
    projectId: string
    fieldIds: string[]
    recordIds: string[]
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
    folderId?: string
}

type GetTemplateParams = {
    tableId: string
    log: FastifyBaseLogger
    userMetadata: UserWithMetaInformation | null
    projectId: string
}