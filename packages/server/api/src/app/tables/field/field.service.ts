import { ActivepiecesError, apId, assertNotNullOrUndefined, ErrorCode, isNil, isObject } from '@activepieces/core-utils'
import { CreateFieldRequest, Field, FieldState, FieldType, TableRecordsChangeOp, UpdateFieldRequest } from '@activepieces/shared'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { tableRoom } from '../table-room/table-room'
import { FieldEntity } from './field.entity'

const fieldRepo = repoFactory<Field>(FieldEntity)

export const fieldService = {
    async create({ request, projectId, editorSessionId }: CreateParams): Promise<Field> {
        await this.validateCount({ projectId, tableId: request.tableId })
        const field = await insertField({ request, projectId })
        await notifyFieldsChanged({ tableId: field.tableId, editorSessionId })
        return field
    },

    async createAllFromState({ projectId, tableId, fields }: CreateAllFromStateParams): Promise<void> {
        await this.validateCount({ projectId, tableId, insertCount: fields.length })
        await Promise.all(fields.map((field, position) => insertFromState({ projectId, field, tableId, position })))
        await notifyFieldsChanged({ tableId, editorSessionId: null })
    },

    async syncFromState({ projectId, tableId, fields }: SyncFromStateParams): Promise<void> {
        const existingFields = await this.getAll({ projectId, tableId })
        const newFieldsCount = fields.filter((field) => !existingFields.some((existing) => existing.externalId === field.externalId)).length
        await this.validateCount({ projectId, tableId, insertCount: newFieldsCount })
        await Promise.all(fields.map(async (field, position) => {
            const existingField = existingFields.find((existing) => existing.externalId === field.externalId)
            if (isNil(existingField)) {
                await insertFromState({ projectId, field, tableId, position })
                return
            }
            await fieldRepo().update({ id: existingField.id, projectId }, { name: field.name })
        }))
        const removedFields = existingFields.filter((existing) => !fields.some((field) => field.externalId === existing.externalId))
        await Promise.all(removedFields.map((field) => fieldRepo().delete({ id: field.id, projectId })))
        await notifyFieldsChanged({ tableId, editorSessionId: null })
    },

    async getAll({ projectId, tableId }: GetAllParams): Promise<Field[]> {
        return fieldRepo().find({
            where: { projectId, tableId },
            order: {
                position: 'ASC',
                created: 'ASC',
            },
        })
    },

    async getAllByTableIds({ projectId, tableIds }: GetAllByTableIdsParams): Promise<Map<string, Field[]>> {
        const fields = await fieldRepo().find({
            where: { projectId, tableId: In(tableIds) },
            order: {
                position: 'ASC',
                created: 'ASC',
            },
        })
        const result = new Map<string, Field[]>()
        for (const tableId of tableIds) {
            result.set(tableId, [])
        }
        for (const field of fields) {
            result.get(field.tableId)?.push(field)
        }
        return result
    },

    async getById({ id, projectId }: GetByIdParams): Promise<Field> {
        const field = await fieldRepo().findOne({
            where: { id, projectId },
        })

        if (isNil(field)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'Field',
                    entityId: id,
                },
            })
        }

        return field
    },

    async delete({ id, projectId, editorSessionId }: DeleteParams): Promise<void> {
        const deleted = await fieldRepo().createQueryBuilder()
            .delete()
            .where('id = :id AND "projectId" = :projectId', { id, projectId })
            .returning(['tableId'])
            .execute()
        const deletedRows: unknown = deleted.raw
        const row: unknown = Array.isArray(deletedRows) ? deletedRows[0] : undefined
        const tableId = isObject(row) ? row['tableId'] : undefined
        if (typeof tableId !== 'string') {
            return
        }
        await notifyFieldsChanged({ tableId, editorSessionId })
    },

    async update({ id, projectId, request, editorSessionId }: UpdateParams): Promise<Field> {
        if (isNil(request.name)) {
            return this.getById({ id, projectId })
        }
        await fieldRepo().update({
            id,
            projectId,
        }, {
            name: request.name,
        })
        const field = await this.getById({ id, projectId })
        await notifyFieldsChanged({ tableId: field.tableId, editorSessionId })
        return field
    },

    async reorder({ projectId, tableId, fieldIds, editorSessionId }: ReorderParams): Promise<Field[]> {
        await fieldRepo().query(
            `
            UPDATE "field" AS f
            SET "position" = ordering.ord - 1
            FROM unnest($1::text[]) WITH ORDINALITY AS ordering(id, ord)
            WHERE f."id" = ordering.id
              AND f."projectId" = $2
              AND f."tableId" = $3
              AND f."position" IS DISTINCT FROM ordering.ord - 1
            `,
            [fieldIds, projectId, tableId],
        )
        await notifyFieldsChanged({ tableId, editorSessionId })
        return this.getAll({ projectId, tableId })
    },

    async count({ projectId, tableId }: CountParams): Promise<number> {
        return fieldRepo().count({
            where: { projectId, tableId },
        })
    },
    async validateCount({ projectId, tableId, insertCount = 1 }: ValidateCountParams): Promise<void> {
        const countRes = await this.count({ projectId, tableId })
        if (countRes + insertCount > system.getNumberOrThrow(AppSystemProp.MAX_FIELDS_PER_TABLE)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Max fields per table reached: ${system.getNumberOrThrow(AppSystemProp.MAX_FIELDS_PER_TABLE)}`,
                },
            })
        }
    },
}

async function insertField({ request, projectId }: InsertFieldParams): Promise<Field> {
    const maxPosition = await fieldRepo().maximum('position', { projectId, tableId: request.tableId })
    return fieldRepo().save({
        ...request,
        position: request.position ?? (maxPosition ?? -1) + 1,
        projectId,
        id: apId(),
        externalId: request.externalId ?? apId(),
    })
}

async function insertFromState({ projectId, field, tableId, position }: InsertFromStateParams): Promise<Field> {
    switch (field.type) {
        case FieldType.STATIC_DROPDOWN: {
            assertNotNullOrUndefined(field.data, 'Data is required for static dropdown field')
            return insertField({
                projectId,
                request: {
                    name: field.name,
                    type: field.type,
                    tableId,
                    data: field.data,
                    externalId: field.externalId,
                    position,
                },
            })
        }
        case FieldType.DATE:
        case FieldType.DATETIME:
        case FieldType.NUMBER:
        case FieldType.TEXT: {
            return insertField({
                projectId,
                request: {
                    name: field.name,
                    type: field.type,
                    tableId,
                    externalId: field.externalId,
                    position,
                },
            })
        }
        default: {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `Unsupported field type: ${field.type}`,
                },
            })
        }
    }
}

async function notifyFieldsChanged({ tableId, editorSessionId }: NotifyFieldsChangedParams): Promise<void> {
    await tableRoom(system.globalLogger()).notifyChanged({ tableId, change: { op: TableRecordsChangeOp.FIELDS_CHANGED }, editorSessionId })
}

type NotifyFieldsChangedParams = {
    tableId: string
    editorSessionId: string | null
}

type CreateParams = {
    projectId: string
    request: CreateFieldRequest
    editorSessionId: string | null
}

type InsertFieldParams = {
    projectId: string
    request: CreateFieldRequest
}

type InsertFromStateParams = {
    projectId: string
    field: FieldState
    tableId: string
    position: number
}

type CreateAllFromStateParams = {
    projectId: string
    tableId: string
    fields: FieldState[]
}

type SyncFromStateParams = {
    projectId: string
    tableId: string
    fields: FieldState[]
}

type GetAllParams = {
    projectId: string
    tableId: string
}

type GetAllByTableIdsParams = {
    projectId: string
    tableIds: string[]
}

type GetByIdParams = {
    id: string
    projectId: string
}

type DeleteParams = {
    id: string
    projectId: string
    editorSessionId: string | null
}

type UpdateParams = {
    id: string
    projectId: string
    request: UpdateFieldRequest
    editorSessionId: string | null
}

type ReorderParams = {
    projectId: string
    tableId: string
    fieldIds: string[]
    editorSessionId: string | null
}

type CountParams = {
    projectId: string
    tableId: string
}

type ValidateCountParams = {
    projectId: string
    tableId: string
    insertCount?: number
}
