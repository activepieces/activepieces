import { apId, ProjectId, PutStoreEntryRequest, StoreEntry } from '@activepieces/shared'
import { databaseConnection } from '../database/database-connection'
import { StoreEntryEntity } from './store-entry-entity'
import { acquireLock, ApLock } from '../helper/lock'

const storeEntryRepo = databaseConnection.getRepository<StoreEntry>(StoreEntryEntity)

export const storeEntryService = {
    async upsert({ projectId, request }: { projectId: ProjectId, request: PutStoreEntryRequest }): Promise<StoreEntry | null> {
        const keyLock = await getLock(request.key)

        try {
            const previousEntry = await this.getOne({ projectId, key: request.key })

            if (previousEntry) {
                await storeEntryRepo.update(previousEntry.id, request)

                return await this.getOne({ projectId, key: request.key })
            }

            const entryRequest: Omit<StoreEntry, 'created' | 'updated'> = {
                id: apId(),
                key: request.key,
                value: request.value,
                projectId,
            }

            return await storeEntryRepo.save(entryRequest)
        }
        finally {
            await keyLock.release()
        }
    },
    
    async getOne({ projectId, key }: { projectId: ProjectId, key: string }): Promise<StoreEntry | null> {
        return storeEntryRepo.findOneBy({
            projectId,
            key,
        })
    },

    async delete({ projectId, key }: { projectId: ProjectId, key: string }): Promise<void> {
        const keyLock = await getLock(key)

        try {
            await storeEntryRepo.delete({
                projectId,
                key,
            })
        }
        finally {
            await keyLock.release()
        }
    },
}

async function getLock(key: string): Promise<ApLock> {
    return acquireLock({
        key,
        timeout: 10000,
    })
}
