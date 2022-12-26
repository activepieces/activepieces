import { apId, UpsertInstanceRequest, Cursor, Instance, InstanceId, ProjectId, SeekPage } from "shared";
import { collectionService } from "../collections/collection.service";
import { flowService } from "../flows/flow-service";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { Order } from "../helper/pagination/paginator";
import { InstanceEntity } from "./instance-entity";
import { instanceRepo as repo } from "./instance-repo";

export const instanceService = {
    async upsert({ collectionId, status }: UpsertInstanceRequest): Promise<Instance | null> {
        const collection = await collectionService.getOne(
            collectionId,
            undefined,
        );

        if (!collection) {
            return null;
        }

        const flowPage = await flowService.list(collectionId, undefined, Number.MAX_VALUE);

        const flowIdToVersionId = Object.fromEntries(
            flowPage.data.map(
                flow => [flow.id, flow.version.id]
            )
        );

        const instance: Partial<Instance> = await repo.findOneBy({ id: collectionId }) ?? {
            id: apId(),
            projectId: collection.projectId,
        };

        instance.collectionId = collectionId;
        instance.collectionVersionId = collection.version.id;
        instance.flowIdToVersionId = flowIdToVersionId;
        instance.status = status;

        return repo.save(instance);
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
    cursor: Cursor | undefined,
    limit: number,
};

type GetOneParams = {
    id: InstanceId,
};

type DeleteOneParams = {
    id: InstanceId,
};
