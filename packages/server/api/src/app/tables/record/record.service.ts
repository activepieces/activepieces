import { Readable } from 'stream'
import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    chunk,
    CreateRecordsRequest,
    Cursor,
    ErrorCode,
    Filter,
    FilterOperator,
    GetFlowVersionForWorkerRequestType,
    ImportCsvRequestBody,
    isNil,
    ApRecord,
    SeekPage,
    TableWebhookEventType,
    UpdateRecordRequest,
    Cell,
} from '@activepieces/shared'
import { parse } from 'csv-parse'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { system } from '../../helper/system/system'
import { webhookService } from '../../webhooks/webhook.service'
import { FieldEntity } from '../field/field.entity'
import { fieldService } from '../field/field.service'
import { tableService } from '../table/table.service'
import { CellEntity } from './cell.entity'
import { RecordEntity, RecordSchema } from './record.entity'


const recordRepo = repoFactory(RecordEntity)

export const recordService = {
    async create({
        request,
        projectId,
    }: CreateParams): Promise<ApRecord[]> {
        await this.validateCount({ projectId, tableId: request.tableId }, request.records.length)
        return transaction(async (entityManager: EntityManager) => {
            const existingFields = await entityManager
                .getRepository(FieldEntity)
                .find({
                    where: { tableId: request.tableId, projectId },
                })

            const validRecords = request.records.map((recordData) =>
                recordData.filter((cellData) =>
                    existingFields.some((field) => field.id === cellData.fieldId),
                ),
            )
            const now = new Date()
           
            //Todo: remove any
            const records = validRecords.map((_, index) => {
                const created = new Date(now.getTime() + index).toISOString()
              
                return {
                    tableId: request.tableId,
                    projectId,
                    created,
                    id: apId(),
                    updated: created,
                    cells: request.records[index].reduce<Record<string, any>>((acc, cellData) => {
                        acc[cellData.fieldId] = {
                            value: cellData.value,
                            created,
                            updated: created,
                            fieldId: cellData.fieldId,
                            id: apId(),
                            projectId,
                            recordId: apId(),
                        }
                        return acc
                    }, {})
                }
            })

           await entityManager.getRepository(RecordEntity).insert(records)

            // Fetch and return fully populated records
            const insertedRecordIds = records.map((r) => r.id)
            return await entityManager
                .getRepository(RecordEntity)
                .find({
                    where: {
                        id: In(insertedRecordIds),
                        tableId: request.tableId,
                        projectId,
                    },
                    order: {
                        created: 'ASC',
                    },
                })

           
        })
    },

    async list({
        tableId,
        projectId,
        filters,

    }: ListParams): Promise<SeekPage<ApRecord>> {
        const queryBuilder = recordRepo()
            .createQueryBuilder('record')
            .where('record.tableId = :tableId', { tableId })
            .andWhere('record.projectId = :projectId', { projectId })
            .orderBy('record.created', 'ASC')
        if (filters?.length) {
            filters.forEach((filter, _index) => {
                const operator = filter.operator || FilterOperator.EQ
                let condition = ''

                switch (operator) {
                    case FilterOperator.EQ:
                        condition = 'c.value = :fieldValue'
                        break
                    case FilterOperator.NEQ:
                        condition = 'c.value != :fieldValue'
                        break
                    case FilterOperator.GT:
                        condition = 'c.value > :fieldValue'
                        break
                    case FilterOperator.GTE:
                        condition = 'c.value >= :fieldValue'
                        break
                    case FilterOperator.LT:
                        condition = 'c.value < :fieldValue'
                        break
                    case FilterOperator.LTE:
                        condition = 'c.value <= :fieldValue'
                        break
                    case FilterOperator.CO:
                        condition = 'LOWER(c.value) LIKE LOWER(:fieldValue)'
                        break
                }

                // Create a subquery for each filter condition using field ID directly
                const subQuery = recordRepo()
                    .createQueryBuilder('r')
                    .select('1')
                    .where('c.projectId = :projectId') // To use the index
                    .andWhere('c.fieldId = :fieldId')
                    .andWhere('r.id = record.id')
                    .andWhere(condition)
                    .setParameters({
                        projectId,
                        fieldId: filter.fieldId,
                        fieldValue: filter.operator === FilterOperator.CO ? `%${filter.value}%` : filter.value,
                    })

                queryBuilder.andWhere(`EXISTS (${subQuery.getQuery()})`)
                queryBuilder.setParameters(subQuery.getParameters())
            })
        }

        const data = await queryBuilder.getMany()
        return {
            data,
            next: null,
            previous: null,
        }
    },

    async getById({
        id,
        projectId,
    }: GetByIdParams): Promise<ApRecord> {
        const record = await recordRepo().findOne({
            where: { id, projectId },
        })

        if (isNil(record)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'Record',
                    entityId: id,
                },
            })
        }

        return record
    },

    async update({
        id,
        projectId,
        request,
    }: UpdateParams): Promise<ApRecord> {
        const { tableId } = request
        return transaction(async (entityManager: EntityManager) => {
            const record = await entityManager.getRepository(RecordEntity).findOne({
                where: { projectId, tableId, id },
            })

            if (isNil(record)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityType: 'Record',
                        entityId: id,
                    },
                })
            }

            if (request.cells && request.cells.length > 0) {
                const existingFields = await entityManager
                    .getRepository(FieldEntity)
                    .find({
                        where: { projectId, tableId },
                    })

                // Filter out cells with non-existing fields
                const validCells = request.cells.filter((cellData) =>
                    existingFields.some((field) => field.id === cellData.fieldId),
                )

                // Prepare cells for upsert
                const cellsToUpsert = validCells.map((cellData) => {
                    return {
                        recordId: id,
                        fieldId: cellData.fieldId,
                        projectId,
                        value: cellData.value,
                        id: apId(),
                    }
                })

                // Perform bulk upsert only for valid cells
                if (cellsToUpsert.length > 0) {
                    await entityManager
                        .getRepository(CellEntity)
                        .upsert(cellsToUpsert, ['projectId', 'fieldId', 'recordId'])
                }
            }

            // Fetch and return the updated record with full details
            const updatedRecord = await entityManager
                .getRepository(RecordEntity)
                .findOne({
                    where: { id, projectId, tableId }
                })

            if (isNil(updatedRecord)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        entityType: 'Record',
                        entityId: id,
                    },
                })
            }

            return updatedRecord
        })
    },

    async delete({
        ids,
        projectId,
    }: DeleteParams): Promise<ApRecord[]> {
        const records = await recordRepo().find({
            where: { id: In(ids), projectId }
        })
        await recordRepo().delete({
            id: In(ids),
            projectId,
        })
     
        if (records.length === 0) {
            return []
        }
        return records
    },

    async triggerWebhooks({
        projectId,
        tableId,
        eventType,
        data,
        logger,
        authorization,
    }: TriggerWebhooksParams): Promise<void> {
        const webhooks = await tableService.getWebhooks({
            projectId,
            id: tableId,
            events: [eventType],
        })

        if (webhooks.length === 0) {
            return
        }
        await Promise.all(webhooks.map((webhook) => {
            return webhookService.handleWebhook({
                async: true,
                flowId: webhook.flowId,
                flowVersionToRun: GetFlowVersionForWorkerRequestType.LOCKED,
                saveSampleData: false,
                data: async (_projectId: string) => ({
                    method: 'POST',
                    headers: {
                        authorization,
                    },
                    body: data,
                    queryParams: {},
                }),
                logger,
            })
        }))
    },

    async count({ projectId, tableId }: CountParams): Promise<number> {
        return recordRepo().count({
            where: { projectId, tableId },
        })
    },
    async validateCount(params: CountParams, insertCount: number): Promise<void> {
        const countRes = await this.count(params)
        if (countRes + insertCount > system.getNumberOrThrow(AppSystemProp.MAX_RECORDS_PER_TABLE)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Max records per table reached: ${system.getNumberOrThrow(AppSystemProp.MAX_RECORDS_PER_TABLE)}`,
                },
            })
        }
    },
    async importCsv({
        projectId,
        tableId,
        request,
    }: ImportCsvParams): Promise<ApRecord[]> {
        // validate table existence 
        const count = await this.count({ projectId, tableId })
        await tableService.getById({ projectId, id: tableId })
        const fields = await fieldService.getAll({ projectId, tableId })
        const inputStream = Readable.from(request.file.data as Buffer).setEncoding('utf-8')
        const parser = inputStream.pipe(parse({
            skip_empty_lines: true,
            from_line: request.skipFirstRow ? 2 : 1,
        }))
        const records: { value: string, fieldId: string }[][] = []
        for await (const row of parser) {
            const record: { value: string, fieldId: string }[] = fields.reduce((acc, field, idx) => {
                acc.push({ value: row[idx], fieldId: field.id })                
                return acc
            }, [] as { value: string, fieldId: string }[])
            records.push(record)
        }
        const batches = chunk(records, 100)
        const results: ApRecord[] = []
        let processedCount = 0
        for (const batch of batches) {
            if (processedCount + batch.length + count <= system.getNumberOrThrow(AppSystemProp.MAX_RECORDS_PER_TABLE)) {
                const res = await this.create({
                    projectId,
                    request: {
                        records: batch,
                        tableId,
                    },
                })
                results.push(...res)
            }
            processedCount += batch.length
        }
        return results
    },
}

type CreateParams = {
    request: CreateRecordsRequest
    projectId: string
}

type ListParams = {
    tableId: string
    projectId: string
    cursorRequest: Cursor | null
    limit: number
    filters: Filter[] | null
}

type GetByIdParams = {
    id: string
    projectId: string
}

type UpdateParams = {
    id: string
    projectId: string
    request: UpdateRecordRequest
}

type DeleteParams = {
    ids: string[]
    projectId: string
}

type TriggerWebhooksParams = {
    projectId: string
    tableId: string
    eventType: TableWebhookEventType
    data: Record<string, unknown>
    logger: FastifyBaseLogger
    authorization: string
}



type CountParams = {
    projectId: string
    tableId: string
}

type ImportCsvParams = {
    projectId: string
    tableId: string
    request: ImportCsvRequestBody
}

