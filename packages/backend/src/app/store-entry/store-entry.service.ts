import { apId, ProjectId, PutStoreEntryRequest, StoreEntry } from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { StoreEntryEntity } from './store-entry-entity'

const storeEntryRepo = databaseConnection.getRepository<StoreEntry>(StoreEntryEntity)

export const storeEntryService = {
    async upsert({ projectId, request }: { projectId: ProjectId, request: PutStoreEntryRequest }): Promise<StoreEntry | null> {
        return storeEntryRepo.upsert({
            id: apId(),
            key: request.key,
            value: request.value,
            projectId,
        }, ['projectId', 'key'])
    },
    
    async getOne({ projectId, key }: { projectId: ProjectId, key: string }): Promise<StoreEntry | null> {
        return storeEntryRepo.findOneBy({
            projectId,
            key,
        })
    },

    async delete({ projectId, key }: { projectId: ProjectId, key: string }): Promise<void> {
        await storeEntryRepo.delete({
            projectId,
            key,
        })
    },
}
