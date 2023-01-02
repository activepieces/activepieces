import {
  apId,
  CollectionVersionId,
  Cursor,
  ExecutionOutputStatus,
  FileId,
  FlowRun,
  FlowRunId,
  FlowVersionId,
  ProjectId,
  SeekPage,
  RunEnvironment
} from "shared";
import { collectionVersionService } from "../collections/collection-version/collection-version.service";
import { collectionService } from "../collections/collection.service";
import { databaseConnection } from "../database/database-connection";
import { flowVersionService } from "../flows/flow-version/flow-version.service";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { Order } from "../helper/pagination/paginator";
import { FlowRunEntity } from "./flow-run-entity";
import { flowRunSideEffects } from "./flow-run-side-effects";

export const repo = databaseConnection.getRepository(FlowRunEntity);

export const flowRunService = {
  async list({ projectId, cursor, limit }: ListParams): Promise<SeekPage<FlowRun>> {
    const decodedCursor = paginationHelper.decodeCursor(cursor);
    const paginator = buildPaginator({
      entity: FlowRunEntity,
      paginationKeys: ["created"],
      query: {
        limit,
        order: Order.DESC,
        afterCursor: decodedCursor.nextCursor,
        beforeCursor: decodedCursor.previousCursor,
      },
    });

    const query = repo.createQueryBuilder("flow_run").where({
      projectId,
      environment: RunEnvironment.PRODUCTION,
    });
    const { data, cursor: newCursor } = await paginator.paginate(query);
    return paginationHelper.createPage<FlowRun>(data, newCursor);
  },

  async finish(
    flowRunId: FlowRunId,
    status: ExecutionOutputStatus,
    logsFileId: FileId | null
  ): Promise<FlowRun | null> {
    await repo.update(flowRunId, {
      logsFileId,
      status,
      finishTime: new Date().toISOString(),
    });
    return await this.getOne({ id: flowRunId });
  },

  async start({ flowVersionId, collectionVersionId, payload }: StartParams): Promise<FlowRun> {
    console.log(`[flowRunService#start]  flowVersionId=${flowVersionId}`);

    const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId);
    const collectionVersion = await collectionVersionService.getOneOrThrow(collectionVersionId);
    const collection = await collectionService.getOneOrThrow(collectionVersion.collectionId);

    const flowRun: Partial<FlowRun> = {
      id: apId(),
      projectId: collection.projectId,
      collectionId: collectionVersion.collectionId,
      flowId: flowVersion.flowId,
      flowVersionId: flowVersion.id,
      collectionVersionId: collectionVersion.id,
      flowDisplayName: flowVersion.displayName,
      collectionDisplayName: collectionVersion.displayName,
      status: ExecutionOutputStatus.RUNNING,
      startTime: new Date().toISOString(),
    };

    const savedFlowRun = await repo.save(flowRun);

    await flowRunSideEffects.start({
      flowRun: savedFlowRun,
      payload,
    });

    return savedFlowRun;
  },

  async getOne({ id }: GetOneParams): Promise<FlowRun | null> {
    return await repo.findOneBy({
      id,
    });
  },
};

interface ListParams {
  projectId: ProjectId;
  cursor: Cursor | null;
  limit: number;
}

interface GetOneParams {
  id: FlowRunId;
}

interface StartParams {
  environment: RunEnvironment;
  flowVersionId: FlowVersionId;
  collectionVersionId: CollectionVersionId;
  payload: unknown;
}
