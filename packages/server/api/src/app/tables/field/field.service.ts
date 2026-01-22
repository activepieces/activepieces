import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, apId, assertNotNullOrUndefined, CreateFieldRequest, ErrorCode, Field, FieldState, FieldType, isNil, UpdateFieldRequest } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { system } from '../../helper/system/system'
import { FieldEntity } from './field.entity'

const fieldRepo = repoFactory<Field>(FieldEntity)

export const fieldService = {
    async create({ request, projectId }: CreateParams): Promise<Field> {
        await this.validateCount({ projectId, tableId: request.tableId })
        const field = await fieldRepo().save({
            ...request,
            projectId,
            id: apId(),
            externalId: request.externalId ?? apId(),
        })
        return field
    },

    async createFromState({ projectId, field, tableId }: CreateFromStateParams): Promise<Field> {
        switch (field.type) {
            case FieldType.STATIC_DROPDOWN: {
                assertNotNullOrUndefined(field.data, 'Data is required for static dropdown field')
                return this.create({
                    projectId,
                    request: {
                        name: field.name,
                        type: field.type,
                        tableId,
                        data: field.data,
                        externalId: field.externalId,
                    },
                })
            }
            case FieldType.DATE:
            case FieldType.NUMBER:
            case FieldType.TEXT: {
                return this.create({
                    projectId,
                    request: {
                        name: field.name,
                        type: field.type,
                        tableId,
                        externalId: field.externalId,
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
    },

    async getAll({ projectId, tableId }: GetAllParams): Promise<Field[]> {
        return fieldRepo().find({
            where: { projectId, tableId },
            order: {
                created: 'ASC',
            },
        })
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

    async delete({ id, projectId }: DeleteParams): Promise<void> {
        await fieldRepo().delete({
            id,
            projectId,
        })
    },

    async update({ id, projectId, request }: UpdateParams): Promise<Field> {
        await fieldRepo().update({
            id,
            projectId,
        }, {
            name: request.name,
        })
        return this.getById({ id, projectId })
    },

    async count({ projectId, tableId }: CountParams): Promise<number> {
        return fieldRepo().count({
            where: { projectId, tableId },
        })
    },
    async validateCount(params: CountParams): Promise<void> {
        const countRes = await this.count(params)
        if (countRes + 1 > system.getNumberOrThrow(AppSystemProp.MAX_FIELDS_PER_TABLE)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Max fields per table reached: ${system.getNumberOrThrow(AppSystemProp.MAX_FIELDS_PER_TABLE)}`,
                },
            })
        }
    },
}

type CreateParams = {
    projectId: string
    request: CreateFieldRequest
}

type CreateFromStateParams = {
    projectId: string
    field: FieldState
    tableId: string
}

type GetAllParams = {
    projectId: string
    tableId: string
}

type GetByIdParams = {
    id: string
    projectId: string
}

type DeleteParams = {
    id: string
    projectId: string
}

type UpdateParams = {
    id: string
    projectId: string
    request: UpdateFieldRequest
}

type CountParams = {
    projectId: string
    tableId: string
}
