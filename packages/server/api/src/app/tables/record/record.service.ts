import { ActivepiecesError, apId, chunk, Cursor, ErrorCode, isNil, SeekPage, unique } from '@activepieces/core-utils'
import { Cell, CreateRecordsRequest, Field, Filter, FilterOperator, PopulatedRecord, SetRecordColorsRequest, TableColor, TableWebhookEventType, UpdateRecordRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { WebhookFlowVersionToRun, webhookService } from '../../webhooks/webhook.service'
import { FieldEntity } from '../field/field.entity'
import { fieldService } from '../field/field.service'
import { tableService } from '../table/table.service'
import { tableRealtime } from '../table-realtime'
import { CellEntity } from './cell.entity'
import { RecordEntity, RecordSchema } from './record.entity'

const MAX_BATCH_SIZE = 50

const recordRepo = repoFactory(RecordEntity)
const cellsRepo = repoFactory(CellEntity)

export const recordService = {
    async create({
        request,
        projectId,
        fields,
    }: CreateParams): Promise<PopulatedRecord[]> {
        await this.validateCount({ projectId, tableId: request.tableId }, request.records.length)
        const existingFields = fields ?? await fieldService.getAll({
            tableId: request.tableId,
            projectId,
        })

        const validRecords = request.records.map((recordData) =>
            recordData.filter((cellData) =>
                existingFields.some((field) => field.id === cellData.fieldId),
            ),
        )

        let insertedRecordIds: string[] = []
        insertedRecordIds = await transaction(async (entityManager: EntityManager) => {
            const batches = chunk(validRecords, MAX_BATCH_SIZE)
            const records: RecordSchema[] = []
            const insertedRecordIds: string[] = []

            for (const batch of batches) {
                const now = new Date(new Date().getTime() + records.length)
                const recordInsertions = prepareRecordInsertions(batch, request.tableId, projectId, now)
                await entityManager.getRepository(RecordEntity).insert(recordInsertions)

                const cellInsertions = prepareCellInsertions(batch, recordInsertions, projectId)
                await entityManager.getRepository(CellEntity).insert(cellInsertions)

                insertedRecordIds.push(...recordInsertions.map((r) => r.id))
            }

            return insertedRecordIds
        })

        const insertedRecords = await recordRepo().find({
            where: { id: In(insertedRecordIds), tableId: request.tableId, projectId },
            relations: ['cells'],
            order: {
                created: 'ASC',
            },
        })
        const populatedRecords = await formatRecordsAndFetchField({ records: insertedRecords, tableId: request.tableId, projectId, fields: existingFields })
        for (const record of populatedRecords) {
            tableRealtime.recordCreated({ projectId, tableId: request.tableId, record })
        }
        return populatedRecords
    },

    async list({
        tableId,
        projectId,
        filters,
        limit,
        fields: prefetchedFields,
    }: ListParams): Promise<SeekPage<PopulatedRecord> & { totalMatching: number }> {
        const fields = prefetchedFields ?? await fieldService.getAll({
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
        const cellsByRecordId = new Map<string, typeof cells>()
        for (const cell of cells) {
            const group = cellsByRecordId.get(cell.recordId)
            if (group) {
                group.push(cell)
            }
            else {
                cellsByRecordId.set(cell.recordId, [cell])
            }
        }
        for (const record of records) {
            record.cells = cellsByRecordId.get(record.id) ?? []
        }
        const filteredOutRecords = records.filter((record) => {
            if (!filters || filters.length === 0) {
                return true
            }
            return recordMatchesFilters({ record, filters })
        })

        const populatedRecords = await formatRecordsAndFetchField({ records: filteredOutRecords, tableId, projectId, fields })

        return {
            data: populatedRecords.slice(0, limit),
            next: null,
            previous: null,
            totalMatching: populatedRecords.length,
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
        const updatedRecord = await transaction(async (entityManager: EntityManager) => {
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
                        value: cellData.value ?? '',
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
        tableRealtime.recordUpdated({ projectId, tableId, record: updatedRecord })
        return updatedRecord
    },

    async setColors({
        tableId,
        projectId,
        request,
    }: SetColorsParams): Promise<PopulatedRecord[]> {
        const rowTargets = request.records ?? []
        const cellTargets = request.cells ?? []
        const requestedRecordIds = unique([
            ...rowTargets.map((target) => target.recordId),
            ...cellTargets.map((target) => target.recordId),
        ])
        if (requestedRecordIds.length === 0) {
            return []
        }

        const ownedRecords = await recordRepo().find({
            where: { id: In(requestedRecordIds), projectId, tableId },
            select: ['id'],
        })
        const ownedRecordIds = new Set(ownedRecords.map((record) => record.id))

        const validRowTargets = rowTargets.filter((target) => ownedRecordIds.has(target.recordId))
        const validCellTargets = cellTargets.filter((target) => ownedRecordIds.has(target.recordId))

        await transaction(async (entityManager: EntityManager) => {
            const recordIdsByColor = groupRecordIdsByColor(validRowTargets)
            for (const [color, recordIds] of recordIdsByColor) {
                await entityManager.getRepository(RecordEntity).update(
                    { id: In(recordIds), projectId, tableId },
                    { color },
                )
            }

            if (validCellTargets.length > 0) {
                const existingFields = await entityManager.getRepository(FieldEntity).find({
                    where: { projectId, tableId },
                    select: ['id'],
                })
                const existingFieldIds = new Set(existingFields.map((field) => field.id))
                const cellRows = validCellTargets
                    .filter((target) => existingFieldIds.has(target.fieldId))
                    .map((target) => ({
                        id: apId(),
                        recordId: target.recordId,
                        fieldId: target.fieldId,
                        projectId,
                        value: '',
                        color: target.color,
                    }))

                if (cellRows.length > 0) {
                    await entityManager.getRepository(CellEntity)
                        .createQueryBuilder()
                        .insert()
                        .values(cellRows)
                        .orUpdate(['color'], ['projectId', 'fieldId', 'recordId'])
                        .execute()
                }
            }
        })

        const affectedRecordIds = unique([
            ...validRowTargets.map((target) => target.recordId),
            ...validCellTargets.map((target) => target.recordId),
        ])
        const updatedRecords = await recordRepo().find({
            where: { id: In(affectedRecordIds), projectId, tableId },
            relations: ['cells'],
            order: { created: 'ASC' },
        })
        const populatedRecords = await formatRecordsAndFetchField({ records: updatedRecords, tableId, projectId })
        for (const record of populatedRecords) {
            tableRealtime.recordUpdated({ projectId, tableId, record })
        }
        return populatedRecords
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

        await recordRepo().softDelete({
            id: In(ids),
            projectId,
            tableId: firstRecord.tableId,
        })

        if (records.length === 0) {
            return []
        }

        const populatedRecords = await formatRecordsAndFetchField({ records, tableId: firstRecord.tableId, projectId })
        for (const record of populatedRecords) {
            tableRealtime.recordDeleted({ projectId, tableId: firstRecord.tableId, recordId: record.id })
        }
        return populatedRecords
    },

    async deleteByFilter({
        tableId,
        projectId,
        filters,
    }: DeleteByFilterParams): Promise<PopulatedRecord[]> {
        const fields = await fieldService.getAll({ tableId, projectId })
        const records = await recordRepo().find({
            where: { projectId, tableId },
            relations: ['cells'],
        })

        const matchingRecords = records.filter((record) => recordMatchesFilters({ record, filters }))

        const matchingIds = matchingRecords.map((record) => record.id)
        if (matchingIds.length === 0) {
            return []
        }

        await recordRepo().softDelete({
            id: In(matchingIds),
            projectId,
            tableId,
        })

        const populatedRecords = await formatRecordsAndFetchField({ records: matchingRecords, tableId, projectId, fields })
        for (const record of populatedRecords) {
            tableRealtime.recordDeleted({ projectId, tableId, recordId: record.id })
        }
        return populatedRecords
    },

    async deleteAll({
        tableId,
        projectId,
    }: DeleteAllParams): Promise<PopulatedRecord[]> {
        const deletedRecords = await transaction(async (entityManager: EntityManager) => {
            const records = await entityManager.getRepository(RecordEntity).find({
                where: { projectId, tableId },
                relations: ['cells'],
            })

            const recordIds = records.map((record) => record.id)

            if (recordIds.length > 0) {
                await entityManager.getRepository(RecordEntity).softDelete({
                    id: In(recordIds),
                    projectId,
                    tableId,
                })
            }

            return records
        })

        if (deletedRecords.length === 0) {
            return []
        }

        const populatedRecords = await formatRecordsAndFetchField({ records: deletedRecords, tableId, projectId })
        for (const record of populatedRecords) {
            tableRealtime.recordDeleted({ projectId, tableId, recordId: record.id })
        }
        return populatedRecords
    },

    async restore({
        ids,
        projectId,
        tableId,
    }: RestoreParams): Promise<PopulatedRecord[]> {
        // Restored rows re-enter the active count, so enforce the same cap as create —
        // otherwise delete N + insert N + restore N would exceed MAX_RECORDS_PER_TABLE.
        await this.validateCount({ projectId, tableId }, ids.length)
        await recordRepo().restore({
            id: In(ids),
            projectId,
            tableId,
        })

        const records = await recordRepo().find({
            where: { id: In(ids), projectId, tableId },
            relations: ['cells'],
            order: {
                created: 'ASC',
            },
        })

        if (records.length === 0) {
            return []
        }

        const populatedRecords = await formatRecordsAndFetchField({ records, tableId, projectId })
        for (const record of populatedRecords) {
            tableRealtime.recordCreated({ projectId, tableId, record })
        }
        return populatedRecords
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
                flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
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
                failParentOnFailure: true,
            })
        }))
    },

    async count({ projectId, tableId }: CountParams): Promise<number> {
        return recordRepo().count({
            where: { projectId, tableId },
        })
    },
    async countByFilter({ tableId, projectId, filters }: DeleteByFilterParams): Promise<CountByFilterResult> {
        const records = await recordRepo().find({
            where: { projectId, tableId },
            relations: ['cells'],
        })
        const matched = records.filter((record) => recordMatchesFilters({ record, filters })).length
        return { matched, total: records.length }
    },
    async validateCount(params: CountParams, insertCount: number): Promise<void> {
        const countRes = await this.count(params)
        if (countRes + insertCount > system.getNumberOrThrow(AppSystemProp.MAX_RECORDS_PER_TABLE)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `Max records per table reached: ${system.getNumberOrThrow(AppSystemProp.MAX_RECORDS_PER_TABLE)}`,
                },
            })
        }
    },
}

type CreateParams = {
    request: CreateRecordsRequest
    projectId: string
    logger: FastifyBaseLogger
    fields?: Field[]
}

type ListParams = {
    tableId: string
    projectId: string
    cursorRequest: Cursor | null
    limit: number
    filters: Filter[] | null
    fields?: Field[]
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

type SetColorsParams = {
    tableId: string
    projectId: string
    request: SetRecordColorsRequest
}

type DeleteParams = {
    ids: string[]
    projectId: string
}

type DeleteAllParams = {
    tableId: string
    projectId: string
}

type DeleteByFilterParams = {
    tableId: string
    projectId: string
    filters: Filter[]
}

type RestoreParams = {
    ids: string[]
    projectId: string
    tableId: string
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

type CountByFilterResult = {
    matched: number
    total: number
}

type RecordInsertion = {
    id: string
    tableId: string
    projectId: string
    created: string
}

type CellInsertion = {
    id: string
    recordId: string
    fieldId: string
    projectId: string
    value: string
}

function prepareRecordInsertions(
    records: Array<Array<{ fieldId: string, value: string | null }>>,
    tableId: string,
    projectId: string,
    baseDate: Date,
): RecordInsertion[] {
    return records.map((_, index) => {
        const created = new Date(baseDate.getTime() + index).toISOString()
        return {
            tableId,
            projectId,
            created,
            id: apId(),
        }
    })
}

function prepareCellInsertions(
    records: Array<Array<{ fieldId: string, value: string | null }>>,
    recordInsertions: RecordInsertion[],
    projectId: string,
): CellInsertion[] {
    return records.flatMap((recordData, index) =>
        recordData.map((cellData) => {
            return {
                recordId: recordInsertions[index].id,
                fieldId: cellData.fieldId,
                projectId,
                value: cellData.value ?? '',
                id: apId(),
            }
        }),
    )
}

function groupRecordIdsByColor(targets: { recordId: string, color: TableColor | null }[]): Map<TableColor | null, string[]> {
    const recordIdsByColor = new Map<TableColor | null, string[]>()
    for (const target of targets) {
        const existing = recordIdsByColor.get(target.color)
        if (existing) {
            existing.push(target.recordId)
        }
        else {
            recordIdsByColor.set(target.color, [target.recordId])
        }
    }
    return recordIdsByColor
}

async function formatRecordsAndFetchField({ records, tableId, projectId, fields: prefetchedFields }: { records: RecordSchema[], tableId: string, projectId: string, fields?: Field[] }): Promise<PopulatedRecord[]> {
    const fields = prefetchedFields ?? await fieldService.getAll({
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
        const cells = record.cells.reduce<PopulatedRecord['cells']>((acc, cell) => {
            acc[cell.fieldId] = {
                fieldName: fieldsNamesMap[cell.fieldId],
                value: cell.value,
                updated: cell.updated,
                created: cell.created,
                color: cell.color,
            }
            return acc
        }, {})
        for (const field of fields) {
            if (!(field.id in cells)) {
                cells[field.id] = {
                    fieldName: field.name,
                    value: null,
                    updated: record.updated,
                    created: record.created,
                    color: null,
                }
            }
        }
        return {
            ...record,
            cells,
        }
    })
}

function recordMatchesFilters({ record, filters }: { record: { cells: Cell[] }, filters: Filter[] }): boolean {
    return filters.every((filter) => {
        const cell = record.cells.find((c) => c.fieldId === filter.fieldId)
        if (!cell) {
            return filter.operator === FilterOperator.NOT_EXISTS
        }
        return doesCellValueMatchFilters(cell, [filter])
    })
}

function doesCellValueMatchFilters(cell: Cell, filters: Filter[]): boolean {
    if (filters.length === 0) {
        return true
    }
    return filters.every((filter) => {
        if (filter.fieldId !== cell.fieldId) {
            return true
        }
        switch (filter.operator) {
            case FilterOperator.EXISTS: {
                return cell.value !== null && cell.value !== ''
            }
            case FilterOperator.NOT_EXISTS: {
                return cell.value === null || cell.value === ''
            }
            case FilterOperator.EQ: {
                return cell.value === filter.value
            }
            case FilterOperator.NEQ: {
                return cell.value !== filter.value
            }
            case FilterOperator.GT: {
                return numberFilterValidator({ cellValue: cell.value, filterValue: filter.value, cb: ({ cellValue, filterValue }) => cellValue > filterValue })
            }
            case FilterOperator.GTE: {
                return numberFilterValidator({ cellValue: cell.value, filterValue: filter.value, cb: ({ cellValue, filterValue }) => cellValue >= filterValue })
            }
            case FilterOperator.LT: {
                return numberFilterValidator({ cellValue: cell.value, filterValue: filter.value, cb: ({ cellValue, filterValue }) => cellValue < filterValue })
            }
            case FilterOperator.LTE: {
                return numberFilterValidator({ cellValue: cell.value, filterValue: filter.value, cb: ({ cellValue, filterValue }) => cellValue <= filterValue })
            }
            case FilterOperator.CO: {
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


