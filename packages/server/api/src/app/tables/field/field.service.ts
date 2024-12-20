import { apId, CreateFieldRequest, Field } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { FieldEntity } from './field.entity'

const fieldRepo = repoFactory<Field>(FieldEntity)

export const fieldService = {
    async create({ tableId, request }: { tableId: string, request: CreateFieldRequest }): Promise<Field> {
        const field = await fieldRepo().save({
            ...request,
            tableId,
            id: apId(),
        })
        return field
    },

    async getAll({ tableId }: { tableId: string }): Promise<Field[]> {
        return fieldRepo().find({
            where: { tableId },
        })
    },

    async getById({ tableId, id }: { tableId: string, id: string }): Promise<Field | null> {
        return fieldRepo().findOne({
            where: { tableId, id },
        })
    },

    async delete({ tableId, id }: { tableId: string, id: string }): Promise<void> {
        await fieldRepo().delete({
            tableId,
            id,
        })
    },
}