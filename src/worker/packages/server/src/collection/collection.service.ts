import {
    Collection,
    CreateCollectionRequest,
    CollectionId,
    CollectionVersion,
    CollectionVersionState,
    UpdateCollectionRequest
} from "shared";
import KSUID from "ksuid";
import {databaseConnection} from "../database/database-connection";
import {CollectionEntity} from "./collection-entity";
import {collectionVersionService} from "./collection-version/collection-version.service";

const collectionRepo = databaseConnection.getRepository<Collection>(CollectionEntity);


export const collectionService = {

    async getOne(id: CollectionId): Promise<Collection | null> {
        return collectionRepo.findOneBy({
            id: Object(id)
        });
    },

    async update(collectionId: CollectionId, request: UpdateCollectionRequest): Promise<CollectionVersion> {
        let lastVersion = await collectionVersionService.getLastVersion(collectionId);
        if (lastVersion.state === CollectionVersionState.LOCKED) {
            lastVersion = await collectionVersionService.createVersion(collectionId, request);
        } else {
            await collectionVersionService.updateVersion(lastVersion, request);
        }
        return collectionVersionService.getLastVersion(collectionId);
    },

    async create(request: CreateCollectionRequest): Promise<Collection> {
        const collection: Partial<Collection> = {
            id: KSUID.randomSync(),
            projectId: request.projectId
        }
        await collectionVersionService.createVersion(collection.id, {displayName: request.displayName, configs: []});
        return collectionRepo.save(collection);
    },
};
