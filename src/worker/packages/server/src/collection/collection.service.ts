import {
    CreateCollectionRequest,
    CollectionId,
    CollectionVersion,
    CollectionVersionState,
    UpdateCollectionRequest, Collection, SeekPage, Cursor, apId
} from "shared";
import {databaseConnection} from "../database/database-connection";
import {collectionVersionService} from "./collection-version/collection-version.service";
import {ProjectId} from "shared/dist/model/project";
import {CollectionEntity, CollectionSchema} from "./collection-entity";
import {paginationHelper} from "../helper/pagination/pagination-utils";
import {buildPaginator} from "../helper/pagination/build-paginator";

const collectionRepo = databaseConnection.getRepository(CollectionEntity);


export const collectionService = {

    async getOne(id: CollectionId): Promise<Collection | null> {
        return collectionRepo.findOneBy({
            id: id
        });
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
        const queryBuilder = collectionRepo.createQueryBuilder().where({projectId: projectId});
        const {data, cursor} = await paginator.paginate(queryBuilder.where({projectId: projectId}));
        return paginationHelper.createPage<Collection>(data, cursor);
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
            id: apId(),
            projectId: request.projectId
        }

        let savedCollection = await collectionRepo.save(collection);
        await collectionVersionService.createVersion(savedCollection.id, {displayName: request.displayName, configs: []});
        return savedCollection;
    },

    async delete(collectionId: CollectionId) : Promise<void> {
        await collectionRepo.delete({id: collectionId})
    }
};
