import {CollectionId} from "shared/dist/model/collection";
import {collectionRepo, collectionVersionRepo} from "./collection-repo";
import {Collection, CollectionVersion, Config, UpdateCollectionRequest, User} from "shared";
import KSUID from "ksuid";
import {CreateCollectionRequest} from "shared/dist/collection/dto/create-collection-request";
import {CollectionVersionState} from "shared/dist/collection/collection-version";

export const collectionService = {

    async getOne(id: CollectionId): Promise<Collection | null> {
        return collectionRepo.findOneBy({
            id: Object(id)
        });
    },

    async update(collectionId: CollectionId, request: UpdateCollectionRequest): Promise<Collection> {
        const collection: Partial<Collection> = {
            id: KSUID.randomSync()
        }
        return collectionRepo.findOneBy({
            id: Object(collectionId)
        });
    },

    async create(request: CreateCollectionRequest): Promise<Collection> {
        const collection: Partial<Collection> = {
            id: KSUID.randomSync(),
            projectId: request.projectId
        }
        await createVersion(collection.id, request);
        return collectionRepo.save(collection);
    },
};

async function createVersion(collectionId: CollectionId, request: { displayName: string }): Promise<CollectionVersion> {
    const collectionVersion: Partial<CollectionVersion> = {
        id: KSUID.randomSync(),
        displayName: request.displayName,
        collectionId: collectionId,
        configs: [],
        state: CollectionVersionState.DRAFT
    }
    return collectionVersionRepo.save(collectionVersion)
}
