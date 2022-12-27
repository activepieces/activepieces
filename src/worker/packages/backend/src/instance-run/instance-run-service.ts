import { Cursor, InstanceRun, InstanceRunId, ProjectId, SeekPage } from "shared";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { Order } from "../helper/pagination/paginator";
import { InstanceRunEntity } from "./instance-run-entity";
import { instanceRunRepo as repo } from "./instance-run-repo";

export const instanceRunService = {
    async list({ projectId, cursor, limit }: ListParams): Promise<SeekPage<InstanceRun>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor);

        const paginator = buildPaginator({
            entity: InstanceRunEntity,
            paginationKeys: ["created"],
            query: {
                limit: limit,
                order: Order.ASC,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor
            },
        });

        const query = repo.createQueryBuilder("instance_run").where({
            projectId,
        });

        const { data, cursor: newCursor } = await paginator.paginate(query);

        return paginationHelper.createPage<InstanceRun>(data, newCursor);
    },

    async getOne({ id }: GetOneParams): Promise<InstanceRun | null> {
        return repo.findOneBy({
            id,
        });
    },
};

type ListParams = {
    projectId: ProjectId,
    cursor: Cursor | undefined,
    limit: number,
};

type GetOneParams = {
    id: InstanceRunId,
};
