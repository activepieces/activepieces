import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    Cell,
    chunk,
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
import { system } from '../../helper/system/system'
import { webhookService } from '../../webhooks/webhook.service'
import { FieldEntity } from '../field/field.entity'
import { fieldService } from '../field/field.service'
import { tableService } from '../table/table.service'
import { CellEntity } from './cell.entity'
import { RecordEntity, RecordSchema } from './record.entity'

const recordRepo = repoFactory(RecordEntity)
const cellsRepo = repoFactory(CellEntity)
export const recordService = {
    async create({
        request,
        projectId,
    }: CreateParams): Promise<PopulatedRecord[]> {
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
            // to avoid sql query text limit
            const batches = chunk(validRecords, 50)
            const records: RecordSchema[] = []
            for (const batch of batches) {
                const now = new Date(new Date().getTime() + records.length)
                const recordInsertions = batch.map((_, index) => {
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
                const cellInsertions = batch.flatMap((recordData, index) =>
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
                const result = await entityManager
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
                records.push(...result)
            }
            return formatRecordsAndFetchField({ records, tableId: request.tableId, projectId })
          
        
        })
    },

    async list({
        tableId,
        projectId,
        filters,
    }: ListParams): Promise<SeekPage<PopulatedRecord>> {
       
        const fields = await fieldService.getAll({
            tableId,
            projectId,
        })
        const records = await recordRepo().find({
            where: {
                projectId,
                tableId,
            },
            order: {
                created: 'ASC',
            },
        })

        const cells = await cellsRepo().find({
            where: {
                projectId,
                fieldId: In(fields.map((field) => field.id)),
                recordId: In(records.map((record) => record.id)),
            },
        })
        records.map((record) => {
            record.cells = cells.filter((cell) => cell.recordId === record.id)
        })
        const filteredOutRecords = records.filter((record) => {
            return record.cells.every((cell) => doesCellValueMatchFilters(cell, filters ?? []))
        })
       
        const populatedRecords = await formatRecordsAndFetchField({ records: filteredOutRecords, tableId, projectId })
    
        return {
            data: populatedRecords,
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

        const result = await formatRecordsAndFetchField({ records: [record], tableId: record.tableId, projectId: record.projectId })
        return result[0]
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

            const result = await formatRecordsAndFetchField({ records: [updatedRecord], tableId: updatedRecord.tableId, projectId: updatedRecord.projectId })
            return result[0]
        })
    },

    async delete({
        ids,
        projectId,
    }: DeleteParams): Promise<PopulatedRecord[]> {
        const firstRecord = await recordRepo().findOne({
            where: { id: ids[0], projectId },
            select: ['tableId'],
        })
        if (isNil(firstRecord)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'Record', entityId: ids[0] },
            })
        }

        const records = await recordRepo().find({
            where: { id: In(ids), projectId, tableId: firstRecord.tableId },
            relations: ['cells'],
        })
        
        await recordRepo().delete({
            id: In(ids),
            projectId,
            tableId: firstRecord.tableId,
        })
     
        if (records.length === 0) {
            return []
        }
       
        return formatRecordsAndFetchField({ records, tableId: firstRecord.tableId, projectId })
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
                execute: true,
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




async function formatRecordsAndFetchField({ records, tableId, projectId }: { records: RecordSchema[], tableId: string, projectId: string }): Promise<PopulatedRecord[]> {
    const fields = await fieldService.getAll({
        tableId,
        projectId,
    })
    return formatRecords(records, fields)
}

function formatRecords(records: RecordSchema[], fields: Field[]): PopulatedRecord[] {
    const fieldsNamesMap: Record<string, string> = fields.reduce((acc, field) => {
        acc[field.id] = field.name
        return acc
    }, {} as Record<string, string>)
    return records.map((record) => {
        return {
            ...record,
            cells: record.cells.reduce<PopulatedRecord['cells']>((acc, cell) => {
                acc[cell.fieldId] = {
                    fieldName: fieldsNamesMap[cell.fieldId],
                    value: cell.value,
                    updated: cell.updated,
                    created: cell.created,
                }
                return acc  
            }, {}),
        }
    })
}


function doesCellValueMatchFilters(cell: Cell, filters: Filter[]): boolean {
    if (filters.length === 0) {
        return true
    }
    const filtersForCellFields = filters.filter((filter) => filter.fieldId === cell.fieldId)
    if (filtersForCellFields.length === 0) {
        return true
    }
    return filtersForCellFields.every((filter) => {
        if (filter.operator === undefined) {
            return true
        }
        switch (filter.operator) {
            case FilterOperator.EQ:{
                return cell.value === filter.value
            }
            case FilterOperator.NEQ:{
                return cell.value !== filter.value
            }
            case FilterOperator.GT:{
                return numberFilterValidator({ cellValue: cell.value, filterValue: filter.value, cb: ({ cellValue, filterValue })=> cellValue > filterValue })
            }
            case FilterOperator.GTE:{
                return numberFilterValidator({ cellValue: cell.value, filterValue: filter.value, cb: ({ cellValue, filterValue })=> cellValue >= filterValue })
            }
            case FilterOperator.LT:{
                return numberFilterValidator({ cellValue: cell.value, filterValue: filter.value, cb: ({ cellValue, filterValue })=> cellValue < filterValue })          
            }
            case FilterOperator.LTE:{
                return numberFilterValidator({ cellValue: cell.value, filterValue: filter.value, cb: ({ cellValue, filterValue })=> cellValue <= filterValue })
            }
            case FilterOperator.CO:{
                if (typeof cell.value === 'string') {
                    return cell.value.toLowerCase().includes(filter.value.toLowerCase())
                }
                return false
            }
        
        }
    })
   
}


const numberFilterValidator = ({ cellValue, filterValue, cb }: { cellValue: unknown, filterValue: string, cb: ({ cellValue, filterValue }: { cellValue: number, filterValue: number }) => boolean }) => {
    if (typeof cellValue === 'string' || typeof cellValue === 'number') {
        const cv = parseFloat(cellValue as string)
        const fv = parseFloat(filterValue)
        if (isNaN(cv) || isNaN(fv)) {
            return false
        }
        return cb({ cellValue: cv, filterValue: fv })
    }
    return false
}
