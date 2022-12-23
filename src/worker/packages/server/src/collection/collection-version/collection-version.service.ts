import {CollectionVersion, CollectionVersionState, UpdateCollectionRequest, CollectionId, apId} from "shared";
import {databaseConnection} from "../../database/database-connection";
import {CollectionVersionEntity} from "./collection-version-entity";

const collectionVersionRepo = databaseConnection.getRepository<CollectionVersion>(CollectionVersionEntity);


export const collectionVersionService = {

    async updateVersion(collectionVersion: CollectionVersion, request: UpdateCollectionRequest): Promise<CollectionVersion> {
        await collectionVersionRepo.update(collectionVersion.id, request);
        return collectionVersionRepo.findOneBy({
            id: collectionVersion.id
        });
    },


    async getLastVersion(collectionId: CollectionId): Promise<CollectionVersion> {
        return collectionVersionRepo.findOne({
            where: {
                collectionId: collectionId,
            },
            order: {
                created: 'DESC',
            }
        });
    },

    async createVersion(collectionId: CollectionId, request: UpdateCollectionRequest): Promise<CollectionVersion> {
        const collectionVersion: Partial<CollectionVersion> = {
            id: apId(),
            displayName: request.displayName,
            collectionId: collectionId,
            configs: request.configs,
            state: CollectionVersionState.DRAFT
        }
        return collectionVersionRepo.save(collectionVersion)
    }

};

