import { apId, CreateTableRequest, Table } from '@activepieces/shared'
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

    async getById({ projectId, id }: { projectId: string, id: string }): Promise<Table | null> {
        return tableRepo().findOne({
            where: { projectId, id },
        })
    },

    async delete({ projectId, id }: { projectId: string, id: string }): Promise<void> {
        await tableRepo().delete({
            projectId,
            id,
        })
    },

    // async import({ projectId, id, data }: { projectId: string, id: string, data: any }): Promise<void> {
    //     // Implement import logic here
    // },
}