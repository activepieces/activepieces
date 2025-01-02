import { ActivepiecesError, apId, CreateFieldRequest, ErrorCode, Field, isNil } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { FieldEntity } from './field.entity'

const fieldRepo = repoFactory<Field>(FieldEntity)

export const fieldService = {
    async create({ request, projectId }: { request: CreateFieldRequest, projectId: string } ): Promise<Field> {
        const field = await fieldRepo().save({
            ...request,
            projectId,
            id: apId(),
        })
        return field
    },

    async getAll({ projectId, tableId }: { projectId: string, tableId: string }): Promise<Field[]> {
        return fieldRepo().find({
            where: { projectId, tableId },
            order: {
                created: 'ASC',
            },
        })
    },

    async getById({ id, projectId }: { id: string, projectId: string }): Promise<Field> {
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

    async delete({ id, projectId }: { id: string, projectId: string }): Promise<void> {
        await fieldRepo().delete({
            id,
            projectId,
        })
    },
}