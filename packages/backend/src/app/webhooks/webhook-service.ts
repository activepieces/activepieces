import {
    ApEnvironment,
    EventPayload,
    Flow,
    FlowId,
    FlowVersion,
    ProjectId,
    RunEnvironment,
} from '@activepieces/shared';
import { flowRunService } from '../flow-run/flow-run-service';
import { flowVersionService } from '../flows/flow-version/flow-version.service';
import { ActivepiecesError, ErrorCode } from '@activepieces/shared';
import { triggerUtils } from '../helper/trigger-utils';
import { flowRepo } from '../flows/flow.repo';
import { system } from '../helper/system/system';
import { SystemProp } from '../helper/system/system-prop';
import { getPublicIp } from '../helper/public-ip-utils';
import { triggerEventService } from '../flows/trigger-events/trigger-event.service';
import { isEmpty, isNil } from 'lodash';
import { logger } from '../helper/logger';

export const webhookService = {
    async callback({ flowId, payload }: CallbackParams): Promise<void> {
        const flow = await getFlowOrThrow(flowId);
        const { projectId, collectionId } = flow;
        const flowVersion = await getLatestFlowVersionOrThrow(flowId, projectId);

        triggerEventService.saveEvent({
            flowId,
            payload,
            projectId,
        });

        const payloads: unknown[] = await triggerUtils.executeTrigger({
            projectId,
            collectionId,
            flowVersion,
            payload,
            simulate: false,
        });

        const createFlowRuns = payloads.map((payload) =>
            flowRunService.start({
                environment: RunEnvironment.PRODUCTION,
                collectionId,
                flowVersionId: flowVersion.id,
                payload,
            })
        );

        await Promise.all(createFlowRuns);
    },

    async simulationCallback({ flowId, payload }: CallbackParams): Promise<void> {
        const flow = await getFlowOrThrow(flowId);
        const { projectId, collectionId } = flow;
        const flowVersion = await getLatestFlowVersionOrThrow(flowId, projectId);

        const events = await triggerUtils.executeTrigger({
            projectId,
            collectionId,
            flowVersion,
            payload,
            simulate: true,
        });

        if (isEmpty(events)) {
            return;
        }

        logger.debug(events, `[WebhookService#simulationCallback] events, flowId=${flowId}`);

        const eventSaveJobs = events.map(event => triggerEventService.saveEvent({
            flowId,
            projectId,
            payload: event,
        }));

        await Promise.all(eventSaveJobs);

        await triggerUtils.disable({
            projectId,
            collectionId,
            flowVersion,
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

const getLatestFlowVersionOrThrow = async (flowId: FlowId, projectId: ProjectId): Promise<FlowVersion> => {
    const flowVersionId = undefined;
    const includeArtifacts = false;

    const flowVersion = await flowVersionService.getFlowVersion(
        projectId,
        flowId,
        flowVersionId,
        includeArtifacts,
    );

    if (isNil(flowVersion)) {
        logger.error(`[WebhookService#getLatestFlowVersionOrThrow] error=flow_version_not_found flowId=${flowId} projectId=${projectId}`);

        throw new ActivepiecesError({
            code: ErrorCode.FLOW_NOT_FOUND,
            params: {
                id: flowId,
            },
        });
    }

    return flowVersion;
};

const getFlowOrThrow = async (flowId: FlowId): Promise<Flow> => {
    const flow = await flowRepo.findOneBy({ id: flowId });

    if (isNil(flow)) {
        logger.error(`[WebhookService#getFlowOrThrow] error=instance_not_found flowId=${flowId}`);

        throw new ActivepiecesError({
            code: ErrorCode.FLOW_NOT_FOUND,
            params: {
                id: flowId,
            },
        });
    }

    return flow;
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
