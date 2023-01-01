import { Collection, CollectionId, Flow, FlowId, Instance } from "shared";
import { collectionService } from "../collections/collection.service";
import { flowRunService } from "../flow-run/flow-run-service";
import { flowService } from "../flows/flow-service";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";
import { instanceService } from "../instance/instance-service";

export const webhookService = {
  async callback({ flowId, payload }: CallbackParams): Promise<void> {
    const flow = await getFlowOrThrow(flowId);
    const collection = await getCollectionOrThrow(flow.collectionId);
    const instance = await getInstanceOrThrow(collection.id);

    await flowRunService.start({
      instanceId: instance.id,
      flowVersionId: flow.version!.id,
      collectionVersionId: collection.version!.id,
      payload,
    });
  },
};

const getFlowOrThrow = async (id: FlowId): Promise<Flow> => {
  const flow = await flowService.getOne(id, undefined);

  if (flow === null) {
    throw new ActivepiecesError({
      code: ErrorCode.FLOW_NOT_FOUND,
      params: {
        id,
      },
    });
  }

  return flow;
};

const getCollectionOrThrow = async (id: CollectionId): Promise<Collection> => {
  const collection = await collectionService.getOne(id, null);

  if (collection === null) {
    throw new ActivepiecesError({
      code: ErrorCode.COLLECTION_NOT_FOUND,
      params: {
        id,
      },
    });
  }

  return collection;
};

const getInstanceOrThrow = async (collectionId: CollectionId): Promise<Instance> => {
  const instance = await instanceService.getByCollectionId({ collectionId });

  if (instance === null) {
    throw new ActivepiecesError({
      code: ErrorCode.INSTANCE_NOT_FOUND,
      params: {
        collectionId,
      },
    });
  }

  return instance;
};

interface CallbackParams {
  flowId: FlowId;
  payload: unknown;
}
