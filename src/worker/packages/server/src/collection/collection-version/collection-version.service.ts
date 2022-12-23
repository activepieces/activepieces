import {CollectionVersion, CollectionVersionState, UpdateCollectionRequest, CollectionId} from "shared";
import KSUID from "ksuid";
import {databaseConnection} from "../../database/database-connection";
import {CollectionVersionEntity} from "./collection-version";

const collectionVersionRepo = databaseConnection.getRepository<CollectionVersion>(CollectionVersionEntity);


export const collectionVersionService = {

    async updateVersion(collectionVersion: CollectionVersion, request: UpdateCollectionRequest): Promise<CollectionVersion> {
        await collectionVersionRepo.update(Object(collectionVersion.id), request);
        return collectionVersionRepo.findOneBy({
            id: Object(collectionVersion.id)
        });
    },


    async getLastVersion(collectionId: CollectionId): Promise<CollectionVersion> {
        return collectionVersionRepo.findOne({
            where: {
                collectionId: Object(collectionId),
            },
            order: {
                id: 'DESC'
            }
        });
    },

    async createVersion(collectionId: CollectionId, request: UpdateCollectionRequest): Promise<CollectionVersion> {
        const collectionVersion: Partial<CollectionVersion> = {
            id: KSUID.randomSync(),
            displayName: request.displayName,
            collectionId: collectionId,
            configs: request.configs,
            state: CollectionVersionState.DRAFT
        }
        return collectionVersionRepo.save(collectionVersion)
    }

};

