import {
    apId,
    Collection,
    CollectionId,
    CreateCollectionRequest,
    Cursor,
    ProjectId,
    SeekPage,
    TelemetryEventName,
    UpdateCollectionRequest,
} from "@activepieces/shared";
import { CollectionEntity } from "./collection.entity";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { databaseConnection } from "../database/database-connection";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { instanceSideEffects } from "../instance/instance-side-effects";
import { telemetry } from "../helper/telemetry.utils";

export const collectionRepo = databaseConnection.getRepository(CollectionEntity);

export const collectionService = {
    /**
   * get a collection by id and versionId
   * @param id collection id to get
   * @param versionId versionId of collection to get, use 'null' for the latest version
   * @returns collection if it exists, else null
   */
    async getOne({ projectId, id }: { projectId: ProjectId, id: CollectionId }): Promise<Collection | null> {
        const collection: Collection | null = await collectionRepo.findOneBy({
            projectId,
            id,
        });
        if (collection === null) {
            return null;
        }
        return collection;
    },
    async getOneOrThrow({ projectId, id }: { projectId: ProjectId, id: CollectionId }): Promise<Collection> {
        const collection = await collectionService.getOne({ projectId, id });

        if (collection === null) {
            throw new ActivepiecesError({
                code: ErrorCode.COLLECTION_NOT_FOUND,
                params: {
                    id,
                },
            });
        }

        return collection;
    },
    async list(projectId: ProjectId, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<Collection>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest);
        const paginator = buildPaginator({
            entity: CollectionEntity,
            paginationKeys: ["created"],
            query: {
                limit,
                order: "ASC",
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        });
        const queryBuilder = collectionRepo.createQueryBuilder("collection").where({ projectId });
        const { data, cursor } = await paginator.paginate(queryBuilder.where({ projectId }));
        return paginationHelper.createPage<Collection>(data, cursor);
    },

    async update({ projectId, collectionId, request }: { projectId: ProjectId, collectionId: CollectionId, request: UpdateCollectionRequest }): Promise<Collection | null> {
        await collectionRepo.update(collectionId, { projectId, id: collectionId, displayName: request.displayName });
        return await collectionService.getOne({ projectId, id: collectionId });
    },

    async create({ projectId, request }: { projectId: ProjectId, request: CreateCollectionRequest }): Promise<Collection> {
        const collection: Partial<Collection> = {
            id: apId(),
            projectId: projectId,
            displayName: request.displayName
        };

        const savedCollection = await collectionRepo.save(collection);
        telemetry.trackProject(
            collection.projectId,
            {
                name: TelemetryEventName.COLLECTION_CREATED,
                payload: {
                    collectionId: collection.id,
                    projectId: collection.projectId
                }
            });
        return savedCollection;
    },

    async delete({ projectId, collectionId }: { projectId: ProjectId, collectionId: CollectionId }): Promise<void> {
        instanceSideEffects.onCollectionDelete({ projectId, collectionId });
        await collectionRepo.delete({ projectId: projectId, id: collectionId });
    },
};
