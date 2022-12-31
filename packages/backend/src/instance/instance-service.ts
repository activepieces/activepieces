import { apId, Cursor, Instance, InstanceId, InstanceStatus, ProjectId, SeekPage, UpsertInstanceRequest } from "shared";
import { collectionService } from "../collections/collection.service";
import { databaseConnection } from "../database/database-connection";
import { flowService } from "../flows/flow-service";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { Order } from "../helper/pagination/paginator";
import { InstanceEntity } from "./instance-entity";
import { instanceSideEffects } from "./instance-side-effects";

export const instanceRepo = databaseConnection.getRepository(InstanceEntity);

export const instanceService = {
  async upsert({ collectionId, status }: UpsertInstanceRequest): Promise<Instance> {
    const collection = await collectionService.getOne(collectionId, null);

    if (collection == null) {
      throw new ActivepiecesError({
        code: ErrorCode.COLLECTION_NOT_FOUND,
        params: {
          id: collectionId,
        },
      });
    }

    const flowPage = await flowService.list(collectionId, null, Number.MAX_SAFE_INTEGER);

    const flowIdToVersionId = Object.fromEntries(flowPage.data.map((flow) => [flow.id, flow.version!.id]));

    const oldInstance: Partial<Instance> = (await instanceRepo.findOneBy({ id: collectionId })) ?? {
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
    };

    const savedInstance = await instanceRepo.save(newInstance);

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
        limit,
        order: Order.ASC,
        afterCursor: decodedCursor.nextCursor,
        beforeCursor: decodedCursor.previousCursor,
      },
    });

    const query = instanceRepo.createQueryBuilder("instance").where({
      projectId,
    });

    const { data, cursor: newCursor } = await paginator.paginate(query);

    return paginationHelper.createPage<Instance>(data, newCursor);
  },

  async getOne({ id }: GetOneParams): Promise<Instance | null> {
    return await instanceRepo.findOneBy({
      id,
    });
  },

  async deleteOne({ id }: DeleteOneParams): Promise<void> {
    await instanceRepo.delete({
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
  id: InstanceId;
}

interface DeleteOneParams {
  id: InstanceId;
}
