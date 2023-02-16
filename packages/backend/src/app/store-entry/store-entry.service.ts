import { apId, CollectionId, PutStoreEntryRequest, StoreEntry } from "@activepieces/shared";
import { databaseConnection } from "../database/database-connection";
import { StoreEntryEntity } from "./store-entry-entity";

const storeEntryRepo = databaseConnection.getRepository<StoreEntry>(StoreEntryEntity);

export const storeEntryService = {
    async upsert(collectionId: CollectionId, request: PutStoreEntryRequest): Promise<StoreEntry | null> {
        const previousEntry = await this.getOne(collectionId, request.key);
        if (previousEntry !== null) {
            await storeEntryRepo.update(previousEntry.id, request);
            return await this.getOne(collectionId, request.key);
        }
        else {
            const entryRequest: Partial<StoreEntry> = {
                id: apId(),
                collectionId,
                key: request.key,
                value: request.value,
            };
            return await storeEntryRepo.save(entryRequest);
        }
    },
    async getOne(collectionId: CollectionId, key: string): Promise<StoreEntry | null> {
        return await storeEntryRepo.findOneBy({
            collectionId,
            key,
        });
    },
};
