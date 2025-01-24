import {
    ActivepiecesError,
    ApEnvironment,
    apId,
    CreateRecordsRequest,
    Cursor,
    ErrorCode,
    Filter,
    FilterOperator,
    isNil,
    PopulatedRecord,
    SeekPage,
    TableWebhookEventType,
    UpdateRecordRequest,
} from '@activepieces/shared'
import { EntityManager, In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { FieldEntity } from '../field/field.entity'
import { CellEntity } from './cell.entity'
import { RecordEntity } from './record.entity'
import { networkUtls, WorkerSystemProp } from '@activepieces/server-shared'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-prop'
import { tableService } from '../table/table.service'
import axios from 'axios'
import { FastifyRequest } from 'fastify'

const recordRepo = repoFactory(RecordEntity)

export const recordService = {
    async create({
        request,
        projectId,
    }: {
        request: CreateRecordsRequest
        projectId: string
    }): Promise<PopulatedRecord[]> {
        return transaction(async (entityManager: EntityManager) => {
            // Find existing fields for the table
            const existingFields = await entityManager
                .getRepository(FieldEntity)
                .find({
                    where: { tableId: request.tableId, projectId },
                })

            // Filter out cells with non-existing fields during record creation
            const validRecords = request.records.map((recordData) =>
                recordData.filter((cellData) =>
                    existingFields.some((field) => field.name === cellData.key),
                ),
            )

            const recordInsertions = validRecords.map(() => ({
                tableId: request.tableId,
                projectId,
                id: apId(),
            }))

            await entityManager.getRepository(RecordEntity).insert(recordInsertions)

            // Prepare cells for insertion
            const cellInsertions = validRecords.flatMap((recordData, index) =>
                recordData.map((cellData) => {
                    const field = existingFields.find((f) => f.name === cellData.key)
                    return {
                        recordId: recordInsertions[index].id,
                        fieldId: field?.id,
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
        cursorRequest,
        limit,
        filters,
    }: ListParams): Promise<SeekPage<PopulatedRecord>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)

        const paginator = buildPaginator({
            entity: RecordEntity,
            query: {
                limit,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryBuilder = recordRepo()
            .createQueryBuilder('record')
            .leftJoinAndSelect('record.cells', 'cell')
            .leftJoinAndSelect('cell.field', 'field')
            .where('record.tableId = :tableId', { tableId })
            .andWhere('record.projectId = :projectId', { projectId })

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

        const paginationResult = await paginator.paginate(queryBuilder)
        return paginationHelper.createPage(
            paginationResult.data,
            paginationResult.cursor,
        )
    },

    async getById({
        id,
        projectId,
    }: {
        id: string
        projectId: string
    }): Promise<PopulatedRecord> {
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
    }: {
        id: string
        projectId: string
        request: UpdateRecordRequest
    }): Promise<PopulatedRecord> {
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
                    existingFields.some((field) => field.name === cellData.key),
                )

                // Prepare cells for upsert
                const cellsToUpsert = validCells.map((cellData) => {
                    const field = existingFields.find((f) => f.name === cellData.key)
                    return {
                        recordId: id,
                        fieldId: field?.id,
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
        id,
        projectId,
    }: {
        id: string
        projectId: string
    }): Promise<PopulatedRecord | undefined> {
        const record = await recordRepo().findOne({
            where: { id, projectId },
            relations: ['cells'],
        })

        if (!isNil(record)) {
            await recordRepo().delete({
                id,
                projectId,
            })
            return record
        }
        return
    },

    async triggerWebhooks({
        projectId,
        tableId,
        eventType,
        data,
        authorization,
    }: {
        projectId: string
        tableId: string
        eventType: TableWebhookEventType
        data: Record<string, unknown>
        authorization: string
    }): Promise<void> {
        const webhooks = await tableService.getWebhooks({
            projectId,
            id: tableId,
            eventType,
        })

        if (webhooks.length > 0) {
            const webhookRequests: {
                flowId: string
                request: Pick<FastifyRequest, 'body'>
            }[] = webhooks.map((webhook) => ({
                flowId: webhook.flowId,
                request: {
                    body: data,
                },
            }))

            const publicUrl = await networkUtls.getPublicUrl(
                system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT),
                system.getOrThrow(WorkerSystemProp.FRONTEND_URL),
            )

            const promises = webhookRequests.map((webhookRequest) => {
                return axios.post(
                    `${publicUrl}v1/webhooks/${webhookRequest.flowId}`,
                    webhookRequest.request,
                    {
                        headers: {
                            authorization,
                        },
                    },
                )
            })
            await Promise.all(promises)
        }
    },
}

type ListParams = {
    tableId: string
    projectId: string
    cursorRequest: Cursor | null
    limit: number
    filters: Filter[] | null
}
