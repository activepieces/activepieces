import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, apId, CreateFieldRequest, ErrorCode, Field, isNil, UpdateFieldRequest } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { system } from '../../helper/system/system'
import { FieldEntity } from './field.entity'
import { transaction } from '../../core/db/transaction'
import { EntityManager } from 'typeorm'

export const fieldRepo = repoFactory<Field>(FieldEntity)

export const fieldService = {
    async create({ request, projectId }: CreateParams): Promise<Field> {
        await this.validateCount({ projectId, tableId: request.tableId })
        const field = await fieldRepo().save({
            ...request,
            projectId,
            id: apId(),
        })
        return field
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
    async bulkUpdate({projectId,tableId,fields}: BulkUpdateParams): Promise<void> {
       return transaction(async (entityManager: EntityManager)=>{
            // Process updates in chunks to avoid query size limitations
            const chunkSize = 100
            for (let i = 0; i < fields.length; i += chunkSize) {
                const chunk = fields.slice(i, i + chunkSize)
                const chunkIds = chunk.map(f => f.id)
                await entityManager
                    .createQueryBuilder()
                    .update(FieldEntity)
                    .set(
                        fields
                    )
                    .where('id IN (:...ids)', { ids: chunkIds })
                    .andWhere('projectId = :projectId', { projectId })
                    .andWhere('tableId = :tableId', { tableId: tableId })
                    .execute()
            }
         })
    },

    async count({ projectId, tableId }: CountParams): Promise<number> {
        return fieldRepo().count({
            where: { projectId, tableId },
        })
    },
    async validateCount(params: CountParams): Promise<void> {
        const countRes = await this.count(params)
        if (countRes > system.getNumberOrThrow(AppSystemProp.MAX_FIELDS_PER_TABLE)) {
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

type BulkUpdateParams = {
    projectId: string
    tableId: string
    fields: Field[]
}
