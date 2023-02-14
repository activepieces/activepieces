import {
  CollectionId,
  FlowId,
  Instance,
  ProjectId,
  RunEnvironment,
} from '@activepieces/shared';
import { collectionService } from '../collections/collection.service';
import { flowRunService } from '../flow-run/flow-run-service';
import { flowVersionService } from '../flows/flow-version/flow-version.service';
import { ActivepiecesError, ErrorCode } from '@activepieces/shared';
import { triggerUtils } from '../helper/trigger-utils';
import { instanceService } from '../instance/instance.service';
import { collectionVersionService } from '../collections/collection-version/collection-version.service';
import { flowRepo } from '../flows/flow.repo';
import { getBackendUrl } from '../helper/public-ip-utils';

export const webhookService = {
  async callback({ flowId, payload }: CallbackParams): Promise<void> {
    const flow = await flowRepo.findOneBy({ id: flowId });
    if (flow === null) {
      throw new ActivepiecesError({
        code: ErrorCode.FLOW_NOT_FOUND,
        params: {
          id: flowId,
        },
      });
    }
    const collection = await collectionService.getOneOrThrow({ projectId: flow.projectId, id: flow.collectionId });
    const instance = await getInstanceOrThrow(flow.projectId, collection.id);
    const collectionVersion = await collectionVersionService.getOneOrThrow(
      instance.collectionVersionId
    );
    console.log(`payload`, payload);
    const flowVersion = await flowVersionService.getOneOrThrow(
      instance.flowIdToVersionId[flow.id]
    );
    const payloads: any[] = await triggerUtils.executeTrigger({
      projectId: collection.projectId,
      collectionVersion: collectionVersion,
      flowVersion: flowVersion,
      payload: payload,
    });

    console.log(`test payloads`, payloads);
    const createFlowRuns = payloads.map((payload) =>
      flowRunService.start({
        environment: RunEnvironment.PRODUCTION,
        collectionVersionId: instance.collectionVersionId,
        flowVersionId: flowVersion.id,
        payload,
      })
    );

    await Promise.all(createFlowRuns);
  },
  async getWebhookPrefix(): Promise<string> {
    const webhookPath = `v1/webhooks`;
    const serverUrl = await getBackendUrl();
    return `${serverUrl}/${webhookPath}`;
  },
  async getWebhookUrl(flowId: FlowId): Promise<string> {
    const webhookPrefix = await this.getWebhookPrefix();
    return `${webhookPrefix}?flowId=${flowId}`;
  }
};

const getInstanceOrThrow = async (
  projectId: ProjectId,
  collectionId: CollectionId
): Promise<Instance> => {
  const instance = await instanceService.getByCollectionId({ projectId, collectionId });

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
