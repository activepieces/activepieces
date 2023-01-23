import { Store } from "@activepieces/pieces";
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
    } else {
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

export function createContextStore(collectionId: CollectionId): Store {
  return {
    put: async function <T>(key: string, value: T): Promise<T> {
      const storeEntry = await storeEntryService.upsert(collectionId, {
        key: key,
        value: value,
      });
      return value;
    },
    get: async function <T>(key: string): Promise<T  | null> {
      const storeEntry = await storeEntryService.getOne(collectionId,  key);
      if(storeEntry === null){
        return null;
      }
      return storeEntry.value as T;
    },
  };
}
