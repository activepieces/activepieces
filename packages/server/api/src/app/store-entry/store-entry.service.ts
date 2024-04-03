import { databaseConnection } from '../database/database-connection'
import { StoreEntryEntity } from './store-entry-entity'
import {
    apId,
    ProjectId,
    PutStoreEntryRequest,
    StoreEntry,
} from '@activepieces/shared'

const storeEntryRepo =
  databaseConnection.getRepository<StoreEntry>(StoreEntryEntity)

export const storeEntryService = {
    async upsert({ projectId, request }: { projectId: ProjectId, request: PutStoreEntryRequest }): Promise<StoreEntry | null> {

        const insertResult = await storeEntryRepo.upsert({
            id: apId(),
            key: request.key,
            value: request.value,
            projectId,
        }, ['projectId', 'key'])

        return {
            projectId,
            key: request.key,
            value: request.value,
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
        return storeEntryRepo.findOneBy({
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
        await storeEntryRepo.delete({
            projectId,
            key,
        })
    },
}