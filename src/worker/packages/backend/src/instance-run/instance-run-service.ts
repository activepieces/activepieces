import { apId, CollectionVersion, Cursor, ExecutionOutputStatus, FileId, FlowVersion, Instance, InstanceId, InstanceRun, InstanceRunId, ProjectId, SeekPage } from "shared";
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
                order: Order.DESC,
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
    async finish(instanceRunId: InstanceRunId, status: ExecutionOutputStatus, logsFileId: FileId): Promise<InstanceRun | null>{
        await repo.update(instanceRunId, {
            logsFileId: logsFileId,
            status: status,
            finishTime: (new Date()).toISOString()
        })
        return this.getOne({id: instanceRunId});
    },
    async start(instanceId: InstanceId | null, projectId: ProjectId, flowVersion: FlowVersion, collectionVerson: CollectionVersion): Promise<InstanceRun> {
        let instanceRun: Partial<InstanceRun> = {
            id: apId(),
            instanceId: instanceId,
            projectId: projectId,
            collectionId: collectionVerson.collectionId,
            flowVersionId: flowVersion.id,
            collectionVersionId: collectionVerson.id,
            flowDisplayName: flowVersion.displayName,
            collectionDisplayName: collectionVerson.displayName,
            status: ExecutionOutputStatus.RUNNING,
            startTime: (new Date()).toISOString()
        };
        return repo.save( instanceRun);
    },
    async getOne({ id }: GetOneParams): Promise<InstanceRun | null> {
        return repo.findOneBy({
            id,
        });
    },
};

type ListParams = {
    projectId: ProjectId,
    cursor: Cursor | null,
    limit: number,
};

type GetOneParams = {
    id: InstanceRunId,
};
