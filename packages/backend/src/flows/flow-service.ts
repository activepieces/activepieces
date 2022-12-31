import { databaseConnection } from "../database/database-connection";
import { FlowEntity } from "./flow-entity";
import {
  apId,
  CollectionId,
  CreateFlowRequest,
  Cursor,
  EmptyTrigger,
  Flow,
  FlowId,
  FlowOperationRequest,
  FlowVersion,
  FlowVersionId,
  FlowVersionState,
  SeekPage,
  TriggerType,
} from "shared";
import { flowVersionService } from "./flow-version/flow-version.service";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { redisLock } from "../database/redis-connection";

const flowRepo = databaseConnection.getRepository(FlowEntity);

export const flowService = {
  async create(request: CreateFlowRequest): Promise<Flow> {
    const flow: Partial<Flow> = {
      id: apId(),
      collectionId: request.collectionId,
    };
    const savedFlow = await flowRepo.save(flow);
    await flowVersionService.createVersion(savedFlow.id, {
      displayName: request.displayName,
      valid: false,
      trigger: {
        displayName: "Empty Trigger",
        name: "trigger",
        type: TriggerType.EMPTY,
        settings: {},
        valid: false,
      } as EmptyTrigger,
    });
    const latestFlowVersion = await flowVersionService.getFlowVersion(savedFlow.id, undefined);
    return {
      ...savedFlow,
      version: latestFlowVersion,
    };
  },
  async list(collectionId: CollectionId, cursorRequest: Cursor | null, limit: number): Promise<SeekPage<Flow>> {
    const decodedCursor = paginationHelper.decodeCursor(cursorRequest);
    const paginator = buildPaginator({
      entity: FlowEntity,
      paginationKeys: ["created"],
      query: {
        limit,
        order: "ASC",
        afterCursor: decodedCursor.nextCursor,
        beforeCursor: decodedCursor.previousCursor,
      },
    });
    const queryBuilder = flowRepo.createQueryBuilder("flow").where({ collectionId });
    const { data, cursor } = await paginator.paginate(queryBuilder.where({ collectionId }));
    // TODO REPLACE WITH SQL QUERY
    const flowVersionsPromises: Array<Promise<FlowVersion | null>> = [];
    data.forEach((collection) => {
      flowVersionsPromises.push(flowVersionService.getFlowVersion(collection.id, undefined));
    });
    const versions: Array<FlowVersion | null> = await Promise.all(flowVersionsPromises);
    for (let i = 0; i < data.length; ++i) {
      data[i] = { ...data[i], version: versions[i] };
    }
    return paginationHelper.createPage<Flow>(data, cursor);
  },
  async getOne(id: FlowId, versionId: FlowVersionId | undefined): Promise<Flow | null> {
    const flow: Flow | null = await flowRepo.findOneBy({
      id,
    });
    if (flow === null) {
      return null;
    }
    const flowVersion = await flowVersionService.getFlowVersion(id, versionId);
    return {
      ...flow,
      version: flowVersion,
    };
  },
  async update(flowId: FlowId, request: FlowOperationRequest): Promise<Flow | null> {
    const flowLock = await redisLock(flowId);
    let lastVersion = (await flowVersionService.getFlowVersion(flowId, undefined))!;
    if (lastVersion.state === FlowVersionState.LOCKED) {
      lastVersion = await flowVersionService.createVersion(flowId, lastVersion);
    }
    await flowVersionService.applyOperation(lastVersion, request);
    await flowLock();
    return await this.getOne(flowId, undefined);
  },
  async delete(flowId: FlowId): Promise<void> {
    await flowRepo.delete({ id: flowId });
  },
};
