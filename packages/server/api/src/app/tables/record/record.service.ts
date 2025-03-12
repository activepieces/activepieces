import {
    ActivepiecesError,
    apId,
    CreateRecordsRequest,
    Cursor,
    ErrorCode,
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
import { tableService } from '../table/table.service'
import { CellEntity } from './cell.entity'
import { RecordEntity } from './record.entity'


const recordRepo = repoFactory(RecordEntity)

export const recordService = {
    async create({
        request,
        projectId,
    }: CreateParams): Promise<PopulatedRecord[]> {
        return transaction(async (entityManager: EntityManager) => {
            // Find existing fields for the table
            const existingFields = await entityManager
                .getRepository(FieldEntity)
                .find({
                    where: { tableId: request.tableId, projectId },
                })
             //find max order 
             const maxOrder = await entityManager.getRepository(RecordEntity).maximum('order', {
                tableId: request.tableId,
                projectId,
            })??0
            
            // Filter out cells with non-existing fields during record creation
            const validRecords = request.records.map((recordData) =>
                recordData.filter((cellData) =>
                    existingFields.some((field) => field.id === cellData.fieldId),
                ),
            )

            const recordInsertions = validRecords.map((_, index) => ({
                tableId: request.tableId,
                projectId,
                id: apId(),
                order: maxOrder +  index +1,
            }))

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

            return fullyPopulatedRecords
        })
    },

    async list({
        tableId,
        projectId,
        filters,
        cursorRequest,
        limit
    }: ListParams): Promise<SeekPage<PopulatedRecord>> {
   
        const queryBuilder = recordRepo()
            .createQueryBuilder('record')
            .leftJoinAndSelect('record.cells', 'cell')
            .leftJoinAndSelect('cell.field', 'field')
            .where('record.tableId = :tableId', { tableId })
            .andWhere('record.projectId = :projectId', { projectId })
            .orderBy('record.order', 'ASC')
        if (filters?.length) {
            filters.forEach((filter, _index) => {
                const operator = filter.operator || FilterOperator.EQ
                let condition: string

                switch (operator) {
                    case FilterOperator.EQ:
                        condition = '='
                        break
                    case FilterOperator.NEQ:
                        condition = '!='
                        break
                    case FilterOperator.GT:
                        condition = '>'
                        break
                    case FilterOperator.GTE:
                        condition = '>='
                        break
                    case FilterOperator.LT:
                        condition = '<'
                        break
                    case FilterOperator.LTE:
                        condition = '<='
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
                    .andWhere(`c.value ${condition} :fieldValue`)
                    .setParameters({
                        projectId,
                        fieldId: filter.fieldId,
                        fieldValue: filter.value,
                    })

                queryBuilder.andWhere(`EXISTS (${subQuery.getQuery()})`)
                queryBuilder.setParameters(subQuery.getParameters())
            })
        }

        // const paginationResult = await paginator.paginate(
        //   queryBuilder
        // )
        // return paginationHelper.createPage(paginationResult.data, paginationResult.cursor)
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

        return record
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

            return updatedRecord
        })
    },

    async delete({
        ids,
        projectId,
    }: DeleteParams): Promise<PopulatedRecord[]> {

        return transaction(async (entityManager: EntityManager)=>{
            const records = await entityManager.getRepository(RecordEntity).find({
                where: { id: In(ids), projectId },
                relations: ['cells'],
                order: {
                    order: 'ASC',
                }
            })
            if(records.length === 0){
                return []
            }
            const tableId = records[0].tableId
            //doesn't currently work like it should, it says updated X rows but in reality all orders stay the same,
            // maybe if we use deferred unique constraint instead of unique index it will work, but we need to keep the order indexed so we can fetch fast
            await entityManager.createQueryBuilder()
            .update(RecordEntity)
            .set({
                order: () => `
                    CASE 
                        WHEN "order" > (
                            SELECT MIN("order") 
                            FROM record 
                            WHERE id IN (:...ids)
                        )
                        THEN "order" - (
                            SELECT COUNT(*) 
                            FROM record 
                            WHERE id IN (:...ids) 
                            AND "order" < record."order"
                        )
                        ELSE "order"
                    END
                `,
            })
            .where('tableId = :tableId', { tableId })
            .andWhere('projectId = :projectId', { projectId })
            .andWhere('id NOT IN (:...ids)', { ids })
            .setParameters({ ids })
            await entityManager.getRepository(RecordEntity).delete({
                id: In(ids),
                projectId,
            })
            return records
        })
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
            webhookService.handleWebhook({
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