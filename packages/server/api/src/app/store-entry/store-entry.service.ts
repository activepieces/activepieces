import {
    apId,
    ProjectId,
    PutStoreEntryRequest,
    sanitizeObjectForPostgresql,
    StoreEntry,
} from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { StoreEntryEntity } from './store-entry-entity'

const storeEntryRepo = repoFactory<StoreEntry>(StoreEntryEntity)

export const storeEntryService = {
    async upsert({ projectId, request }: { projectId: ProjectId, request: PutStoreEntryRequest }): Promise<StoreEntry | null> {
        const value = sanitizeObjectForPostgresql(request.value)
        const insertResult = await storeEntryRepo().upsert({
            id: apId(),
            key: request.key,
            value,
            projectId,
        }, ['projectId', 'key'])

        return {
            projectId,
            key: request.key,
            value,
            id: insertResult.identifiers[0].id,
            created: insertResult.generatedMaps[0].created,
            updated: insertResult.generatedMaps[0].updated,
        }
    },
    async getOne({
        projectId,
        key,
    }: {
        projectId: ProjectId
        key: string
    }): Promise<StoreEntry | null> {
        return storeEntryRepo().findOneBy({
            projectId,
            key,
        })
    },
    async delete({
        projectId,
        key,
    }: {
        projectId: ProjectId
        key: string
    }): Promise<void> {
        await storeEntryRepo().delete({
            projectId,
            key,
        })
    },
}