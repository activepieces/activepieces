import { apId, UpsertInstanceRequest, Cursor, Instance, InstanceId, ProjectId, SeekPage, InstanceStatus } from "shared";
import { collectionService } from "../collections/collection.service";
import { flowService } from "../flows/flow-service";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { Order } from "../helper/pagination/paginator";
import { InstanceEntity } from "./instance-entity";
import { instanceRepo as repo } from "./instance-repo";
import { instanceSideEffects } from "./instance-side-effects";

export const instanceService = {
    async upsert({ collectionId, status }: UpsertInstanceRequest): Promise<Instance> {
        const collection = await collectionService.getOne(
            collectionId,
            null,
        );

        if (!collection) {
            throw new ActivepiecesError({
                code: ErrorCode.COLLECTION_NOT_FOUND,
                params: {
                    id: collectionId,
                },
            });
        }

        const flowPage = await flowService.list(collectionId, null, Number.MAX_SAFE_INTEGER);

        const flowIdToVersionId = Object.fromEntries(
            flowPage.data.map(
                flow => [flow.id, flow.version!.id]
            )
        );

        const oldInstance: Partial<Instance> = await repo.findOneBy({ id: collectionId }) ?? {
            id: apId(),
            projectId: collection.projectId,
            status: InstanceStatus.DISABLED,
        };

        const newInstance: Partial<Instance> = {
            ...oldInstance,
            collectionId,
            collectionVersionId: collection.version!.id,
            flowIdToVersionId,
            status,
        }

        const savedInstance = await repo.save(newInstance);

        instanceSideEffects.disable(oldInstance);
        instanceSideEffects.enable(newInstance);

        return savedInstance;
    },

    async list({ projectId, cursor, limit }: ListParams): Promise<SeekPage<Instance>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor);

        const paginator = buildPaginator({
            entity: InstanceEntity,
            paginationKeys: ["created"],
            query: {
                limit: limit,
                order: Order.ASC,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor
            },
        });

        const query = repo.createQueryBuilder("instance").where({
            projectId,
        });

        const { data, cursor: newCursor } = await paginator.paginate(query);

        return paginationHelper.createPage<Instance>(data, newCursor);
    },

    async getOne({ id }: GetOneParams): Promise<Instance | null> {
        return repo.findOneBy({
            id,
        });
    },

    async deleteOne({ id }: DeleteOneParams): Promise<void> {
        await repo.delete({
            id,
        });
    }
};

type ListParams = {
    projectId: ProjectId,
    cursor: Cursor | null,
    limit: number,
};

type GetOneParams = {
    id: InstanceId,
};

type DeleteOneParams = {
    id: InstanceId,
};
