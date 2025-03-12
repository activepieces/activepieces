import {
    ActivepiecesError,
    apId,
    CreateRecordsRequest,
    Cursor,
    ErrorCode,
    Field,
    Filter,
    FilterOperator,
    GetFlowVersionForWorkerRequestType,
    isNil,
    PopulatedRecord,
    SeekPage,
    TableWebhookEventType,
    UpdateRecordRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
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
    }: CreateParams): Promise<PopulatedRecord[]> {
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
            const recordInsertions = validRecords.map((_, index) => {
                const created = new Date(now.getTime() + index).toISOString()
                return {
                    tableId: request.tableId,
                    projectId,
                    created,
                    id: apId(),
                }
            })

            await entityManager.getRepository(RecordEntity).insert(recordInsertions)

            // Prepare cells for insertion
            const cellInsertions = validRecords.flatMap((recordData, index) =>
                recordData.map((cellData) => {
                    return {
                        recordId: recordInsertions[index].id,
                        fieldId: cellData.fieldId,
                        projectId,
                        value: cellData.value,
                        id: apId(),
                    }
                }),
            )

            await entityManager.getRepository(CellEntity).insert(cellInsertions)

            // Fetch and return fully populated records
            const insertedRecordIds = recordInsertions.map((r) => r.id)
            const fullyPopulatedRecords = await entityManager
                .getRepository(RecordEntity)
                .find({
                    where: {
                        id: In(insertedRecordIds),
                        tableId: request.tableId,
                        projectId,
                    },
                    relations: ['cells'],
                    order: {
                        created: 'ASC',
                    },
                })

            const fields = await fieldService.getAll({
                tableId: request.tableId,
                projectId,
            })
            return fullyPopulatedRecords.map((record) => formatRecord(record, fields))
        })
    },

    async list({
        tableId,
        projectId,
        filters,

    }: ListParams): Promise<SeekPage<PopulatedRecord>> {
        const queryBuilder = recordRepo()
            .createQueryBuilder('record')
            .leftJoinAndSelect('record.cells', 'cell')
            .leftJoinAndSelect('cell.field', 'field')
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
                    .innerJoin('r.cells', 'c')
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
            data: await Promise.all(data.map((record) => formatRecordAndFetchField(record))),
            next: null,
            previous: null,
        }
    },

    async getById({
        id,
        projectId,
    }: GetByIdParams): Promise<PopulatedRecord> {
        const record = await recordRepo().findOne({
            where: { id, projectId },
            relations: ['cells'],
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

        return formatRecordAndFetchField(record)
    },

    async update({
        id,
        projectId,
        request,
    }: UpdateParams): Promise<PopulatedRecord> {
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
                    where: { id, projectId, tableId },
                    relations: ['cells'],
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

            return formatRecordAndFetchField(updatedRecord)
        })
    },

    async delete({
        ids,
        projectId,
    }: DeleteParams): Promise<PopulatedRecord[]> {
        const records = await recordRepo().find({
            where: { id: In(ids), projectId },
            relations: ['cells'],
        })
        await recordRepo().delete({
            id: In(ids),
            projectId,
        })
        const fields = await fieldService.getAll({
            tableId: records[0].tableId,
            projectId,
        })
        return records.map((record) => formatRecord(record, fields))
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


async function formatRecordAndFetchField(record: RecordSchema): Promise<PopulatedRecord> {
    const fields = await fieldService.getAll({
        tableId: record.tableId,
        projectId: record.projectId,
    })
    return formatRecord(record, fields)
}

function formatRecord(record: RecordSchema, fields: Field[]): PopulatedRecord {
    return {
        ...record,
        cells: Object.fromEntries(record.cells.map((cell) => {
            const field = fields.find((field) => field.id === cell.fieldId)
            return [cell.fieldId, {
                fieldName: field!.name,
                value: cell.value,
                updated: cell.updated,
                created: cell.created,
            }]
        })),
    }
}