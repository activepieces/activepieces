import {
    CreateCollectionRequest,
    CollectionId,
    CollectionVersion,
    CollectionVersionState,
    UpdateCollectionRequest, Collection, SeekPage, Cursor, apId, CollectionVersionId
} from "shared";
import {databaseConnection} from "../database/database-connection";
import {collectionVersionService} from "./collection-version/collection-version.service";
import {ProjectId} from "shared";
import {CollectionEntity} from "./collection-entity";
import {paginationHelper} from "../helper/pagination/pagination-utils";
import {buildPaginator} from "../helper/pagination/build-paginator";
import {CollectionVersionEntity} from "./collection-version/collection-version-entity";

const collectionRepo = databaseConnection.getRepository(CollectionEntity);


export const collectionService = {

    async getOne(id: CollectionId, versionId: CollectionVersionId): Promise<Collection | null> {
        let collection: Collection = await collectionRepo.findOneBy({
            id: id
        });
        if (collection === null) {
            return null;
        }
        return {
            ...collection,
            version: await collectionVersionService.getCollectionVersionId(id, versionId)
        }
    },
    async list(projectId: ProjectId, cursorRequest: Cursor | undefined, limit: number): Promise<SeekPage<Collection>> {
            const decodedCursor = paginationHelper.decodeCursor(cursorRequest);
            const paginator = buildPaginator({
                entity: CollectionEntity,
                paginationKeys: ["created"],
                query: {
                    limit: limit,
                    order: 'ASC',
                    afterCursor: decodedCursor.nextCursor,
                    beforeCursor: decodedCursor.previousCursor
                },
            });
            const queryBuilder = collectionRepo.createQueryBuilder("collection").where({projectId: projectId});
            const {data, cursor} = await paginator.paginate(queryBuilder.where({projectId: projectId}));
            // TODO REPLACE WITH SQL QUERY
            let collectionVersionsPromises: Promise<CollectionVersion>[] = [];
            data.forEach(collection => {
                collectionVersionsPromises.push(collectionVersionService.getCollectionVersionId(collection.id, undefined));
            });
            let versions: CollectionVersion[] = await Promise.all(collectionVersionsPromises)
            for (let i = 0; i < data.length; ++i) {
                data[i] = {...data[i], version: versions[i]};
            }
            return paginationHelper.createPage<Collection>(data, cursor);
    },


    async update(collectionId: CollectionId, request: UpdateCollectionRequest): Promise<CollectionVersion> {
        let lastVersion = await collectionVersionService.getCollectionVersionId(collectionId, undefined);
        if (lastVersion.state === CollectionVersionState.LOCKED) {
            lastVersion = await collectionVersionService.createVersion(collectionId, request);
        } else {
            await collectionVersionService.updateVersion(lastVersion, request);
        }
        return collectionVersionService.getCollectionVersionId(collectionId, undefined);
    },

    async create(request: CreateCollectionRequest): Promise<Collection> {
        const collection: Partial<Collection> = {
            id: apId(),
            projectId: request.projectId
        }

        let savedCollection = await collectionRepo.save(collection);
        await collectionVersionService.createVersion(savedCollection.id, {
            displayName: request.displayName,
            configs: []
        });
        return savedCollection;
    },

    async delete(collectionId: CollectionId): Promise<void> {
        await collectionRepo.delete({id: collectionId})
    }
};
