import {
    ApEnvironment,
    EventPayload,
    FlowId,
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
import { triggerEventService } from '../flows/trigger-events/trigger-event.service';
import { flowService } from '../flows/flow.service';

export const webhookService = {
    async callback({ flowId, payload }: CallbackParams): Promise<void> {
        const flow = await flowRepo.findOneBy({ id: flowId });
        if (flow === null || flowId === null || flowId === undefined) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_NOT_FOUND,
                params: {
                    id: flowId,
                },
            });
        }
        triggerEventService.saveEvent({ flowId: flowId, payload, projectId: flow.projectId });
        const collection = await collectionService.getOneOrThrow({ projectId: flow.projectId, id: flow.collectionId });
        const instance = await instanceService.getByCollectionId({ projectId: flow.projectId, collectionId: collection.id });
        if (instance === null) {
            return;
        }
        const flowVersion = await flowVersionService.getOneOrThrow(
            instance.flowIdToVersionId[flow.id]
        );
        const payloads: unknown[] = await triggerUtils.executeTrigger({
            projectId: collection.projectId,
            collectionId: collection.id,
            flowVersion: flowVersion,
            payload: payload,
            simulate: false,
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

    async simulationCallback({ flowId, projectId, payload }: SimulationCallbackParams): Promise<void> {
        const flow = await flowService.getOneOrThrow({
            id: flowId,
            projectId,
        });

        const collection = await collectionService.getOneOrThrow({
            id: flow.collectionId,
            projectId,
        });

        const events = await triggerUtils.executeTrigger({
            projectId: collection.projectId,
            collectionId: collection.id,
            flowVersion: flow.version,
            simulate: true,
            payload,
        });

        const eventSaveJobs = events.map(event => triggerEventService.saveEvent({
            flowId,
            projectId,
            payload: event,
        }));

        await Promise.all(eventSaveJobs);

        await triggerUtils.disable({
            projectId: collection.projectId,
            collectionId: collection.id,
            flowVersion: flow.version,
            simulate: true,
        });
    },

    async getWebhookPrefix(controllerPrefix: WebhookControllerPrefix = ''): Promise<string> {
        const environment = system.get(SystemProp.ENVIRONMENT);

        let url = environment === ApEnvironment.PRODUCTION
            ? system.get(SystemProp.FRONTEND_URL)
            : system.get(SystemProp.WEBHOOK_URL);

        // Localhost doesn't work with webhooks, so we need try to use the public ip
        if (extractHostname(url) == 'localhost' && environment === ApEnvironment.PRODUCTION) {
            url = `http://${(await getPublicIp()).ip}`;
        }

        const slash = url.endsWith('/') ? '' : '/';
        const redirect = environment === ApEnvironment.PRODUCTION ? 'api/' : '';

        return `${url}${slash}${redirect}v1/webhooks${controllerPrefix}`;
    },

    async getWebhookUrl({ flowId, simulate }: GetWebhookUrlParams): Promise<string> {
        const controllerPrefix: WebhookControllerPrefix = simulate ? '/simulate' : '';
        const webhookPrefix = await this.getWebhookPrefix(controllerPrefix);
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

type WebhookControllerPrefix = '' | '/simulate';

type GetWebhookUrlParams = {
    flowId: FlowId;
    simulate?: boolean;
}

type CallbackParams = {
    flowId: FlowId;
    payload: EventPayload;
}

type SimulationCallbackParams = CallbackParams & {
    projectId: ProjectId;
}
