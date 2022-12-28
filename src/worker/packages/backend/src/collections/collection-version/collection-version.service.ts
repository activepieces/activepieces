import {
    CollectionVersion,
    CollectionVersionState,
    UpdateCollectionRequest,
    CollectionId,
    apId,
    CollectionVersionId
} from "shared";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { collectionVersionRepo } from "./collection-version-repo";


export const collectionVersionService = {

    async updateVersion(collectionVersion: CollectionVersion, request: UpdateCollectionRequest): Promise<CollectionVersion | null> {
        await collectionVersionRepo.update(collectionVersion.id, request as QueryDeepPartialEntity<CollectionVersion>);
        return collectionVersionRepo.findOneBy({
            id: collectionVersion.id
        });
    },

    async getOne(id: CollectionVersionId) : Promise<CollectionVersion | null>{
        return collectionVersionRepo.findOneBy({
            id: id
        })
    },

    async getCollectionVersionId(collectionId: CollectionId, versionId: CollectionVersionId | null): Promise<CollectionVersion | null> {
        return collectionVersionRepo.findOne({
            where: {
                collectionId: collectionId,
                id: versionId??undefined,
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

