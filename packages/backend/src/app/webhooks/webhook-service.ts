import {
    ApEnvironment,
    CollectionId,
    EventPayload,
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
import { flowRepo } from '../flows/flow.repo';
import { system } from '../helper/system/system';
import { SystemProp } from '../helper/system/system-prop';
import { getPublicIp } from '../helper/public-ip-utils';
import { getWebhookSecret } from '../helper/secret-helper';

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
        console.log(`payload`, payload);
        const flowVersion = await flowVersionService.getOneOrThrow(
            instance.flowIdToVersionId[flow.id]
        );
        const payloads: unknown[] = await triggerUtils.executeTrigger({
            projectId: collection.projectId,
            collectionId: collection.id,
            flowVersion: flowVersion,
            payload: payload
        });

        const createFlowRuns = payloads.map((payload) =>
            flowRunService.start({
                environment: RunEnvironment.PRODUCTION,
                collectionId: collection.id,
                flowVersionId: flowVersion.id,
                payload,
            })
        );

        await Promise.all(createFlowRuns);
    },
    async getWebhookPrefix(): Promise<string> {
        const environment = system.get(SystemProp.ENVIRONMENT);
        let url = environment === ApEnvironment.PRODUCTION ? system.get(SystemProp.FRONTEND_URL) : system.get(SystemProp.WEBHOOK_URL);
        // Localhost doesn't work with webhooks, so we need try to use the public ip
        if (extractHostname(url) == 'localhost' && environment === ApEnvironment.PRODUCTION) {
            url = `http://${(await getPublicIp()).ip}`;
        }
        const slash = url.endsWith('/') ? '' : '/';
        const redirect = environment === ApEnvironment.PRODUCTION ? 'api/' : '';
        return `${url}${slash}${redirect}v1/webhooks`;
    },
    async getWebhookUrl(flowId: FlowId): Promise<string> {
        const webhookPrefix = await this.getWebhookPrefix();
        return `${webhookPrefix}/${flowId}`;
    }
};

function extractHostname(url: string): string | null {
    try {
        const hostname = new URL(url).hostname;
        return hostname;
    }
    catch (e) {
        return null;
    }
}

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
  payload: EventPayload;
}
