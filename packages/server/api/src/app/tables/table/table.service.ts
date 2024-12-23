import { ActivepiecesError, apId, CreateTableRequest, ErrorCode, isNil, Table } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { TableEntity } from './table.entity'

const tableRepo = repoFactory(TableEntity)

export const tableService = {
    async create({ projectId, request }: { projectId: string, request: CreateTableRequest }): Promise<Table> {
        const table = await tableRepo().save({
            id: apId(),
            name: request.name,
            projectId,
        })

        return table
    },

    async getAll({ projectId }: { projectId: string }): Promise<Table[]> {
        return tableRepo().find({
            where: { projectId },
        })
    },

    async getById({ projectId, id }: { projectId: string, id: string }): Promise<Table> {
        const table = await tableRepo().findOne({
            where: { projectId, id },
        })

        if (isNil(table)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'Table',
                    entityId: id,
                },
            })
        }

        return table
    },

    async delete({ projectId, id }: { projectId: string, id: string }): Promise<void> {
        await tableRepo().delete({
            projectId,
            id,
        })
    },
}