import { apId, ProjectId, PutStoreEntryRequest, StoreEntry } from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { StoreEntryEntity } from './store-entry-entity'

const storeEntryRepo = databaseConnection.getRepository<StoreEntry>(StoreEntryEntity)

export const storeEntryService = {
    async upsert({ projectId, request }: { projectId: ProjectId, request: PutStoreEntryRequest }): Promise<StoreEntry | null> {
        const previousEntry = await this.getOne({ projectId, key: request.key })
        if (previousEntry !== null) {
            await storeEntryRepo.update(previousEntry.id, request)
            return this.getOne({ projectId, key: request.key })
        }
        else {
            const entryRequest: Omit<StoreEntry, 'created' | 'updated'> = {
                id: apId(),
                key: request.key,
                value: request.value,
                projectId,
            }
            return storeEntryRepo.save(entryRequest)
        }
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
