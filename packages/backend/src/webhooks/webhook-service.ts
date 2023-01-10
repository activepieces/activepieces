import { CollectionId, FlowId, Instance, RunEnvironment, TriggerType } from "shared";
import { collectionService } from "../collections/collection.service";
import { flowRunService } from "../flow-run/flow-run-service";
import { flowService } from "../flows/flow-service";
import { flowVersionService } from "../flows/flow-version/flow-version.service";
import { ActivepiecesError, ErrorCode } from "../helper/activepieces-error";
import { triggerUtils } from "../helper/trigger-utils";
import { instanceService } from "../instance/instance-service";

export const webhookService = {
  async callback({ flowId, payload }: CallbackParams): Promise<void> {
    const flow = await flowService.getOneOrThrow(flowId);
    const collection = await collectionService.getOneOrThrow(flow.collectionId);
    const instance = await getInstanceOrThrow(collection.id);

    const flowVersion = await flowVersionService.getOneOrThrow(instance.flowIdToVersionId[flow.id]);
    let payloads: any[] = await triggerUtils.executeTrigger({
      collectionId: collection.id,
      flowVersion: flowVersion,
      payload: payload,
    });


    console.log(`Triggers returned a ${payloads.length} payloads`);

    payloads.forEach((triggerPayload) => {
      flowRunService.start({
        environment: RunEnvironment.PRODUCTION,
        flowVersionId: flowVersion.id,
        collectionVersionId: instance.collectionVersionId,
        payload: triggerPayload,
      });
    });
  },
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
