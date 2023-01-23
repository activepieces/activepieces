import { apId, CollectionId, Instance, InstanceId, UpsertInstanceRequest } from "@activepieces/shared";
import { collectionService } from "../collections/collection.service";
import { databaseConnection } from "../database/database-connection";
import { flowService } from "../flows/flow-service";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { InstanceEntity } from "./instance-entity";
import { instanceSideEffects } from "./instance-side-effects";
import { EventSubscriber, EntitySubscriberInterface, RemoveEvent } from "typeorm";
import { logger } from "../../main";

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

    const oldInstance: Partial<Instance | null> = await instanceRepo.findOneBy({ collectionId });

    if (oldInstance !== null && oldInstance !== undefined) {
      await instanceRepo.delete(oldInstance.id!);
    }

    const newInstance: Partial<Instance> = {
      id: apId(),
      projectId: collection.projectId,
      collectionId,
      collectionVersionId: collection.version!.id,
      flowIdToVersionId,
      status,
    };

    const savedInstance = await instanceRepo.save(newInstance);

    if (oldInstance !== null) {
      await instanceSideEffects.disable(oldInstance);
    }
    await instanceSideEffects.enable(savedInstance);
    return savedInstance;
  },

  async getByCollectionId({ collectionId }: GetOneParams): Promise<Instance | null> {
    return await instanceRepo.findOneBy({
      collectionId,
    });
  },

  async deleteOne({ id }: DeleteOneParams): Promise<void> {
    await instanceRepo.delete({
      id,
    });
  },
};

interface GetOneParams {
  collectionId: CollectionId;
}

interface DeleteOneParams {
  id: InstanceId;
}
