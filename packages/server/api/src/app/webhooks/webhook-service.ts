import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { triggerHooks } from '../flows/trigger'
import { dedupeService } from '../flows/trigger/dedupe'
import { triggerEventService } from '../flows/trigger-events/trigger-event.service'
import { getServerUrl } from '../helper/network-utils'
import { webhookSimulationService } from './webhook-simulation/webhook-simulation-service'
import { WebhookResponse } from '@activepieces/pieces-framework'
import { logger } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, EventPayload,
    ExecutionType,
    Flow,
    FlowId,
    FlowRun,
    FlowStatus,
    FlowVersion,
    isNil,
    ProgressUpdateType,
    ProjectId,
    RunEnvironment,
} from '@activepieces/shared'

export const webhookService = {
    async handshake({
        flow,
        payload,
        simulate,
    }: HandshakeParams): Promise<WebhookResponse | null> {
        logger.info(`[WebhookService#handshake] flowId=${flow.id}`)

        const { projectId } = flow
        const flowVersionId = simulate
            ? (
                await flowVersionService.getFlowVersionOrThrow({
                    flowId: flow.id,
                    versionId: undefined,
                    removeSecrets: false,
                })
            ).id
            : flow.publishedVersionId
        if (isNil(flowVersionId)) {
            logger.info(
                `[WebhookService#handshake] flowInstance not found, flowId=${flow.id}`,
            )
            return null
        }

        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const response = await triggerHooks.tryHandshake({
            projectId,
            flowVersion,
            payload,
        })
        if (response !== null) {
            logger.info(`[WebhookService#handshake] condition met, handshake executed, response:
            ${JSON.stringify(response, null, 2)}`)
        }
        return response
    },
    async callback({
        flow,
        payload,
        synchronousHandlerId,
    }: SyncParams): Promise<FlowRun[]> {
        logger.info(`[WebhookService#callback] flowId=${flow.id}`)

        const { projectId } = flow

        if (flow.status !== FlowStatus.ENABLED || isNil(flow.publishedVersionId)) {
            logger.info(
                `[WebhookService#callback] flowInstance not found or not enabled ignoring the webhook, flowId=${flow.id}`,
            )
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_NOT_FOUND,
                params: {
                    id: flow.id,
                },
            })
        }

        const flowVersion = await flowVersionService.getOneOrThrow(
            flow.publishedVersionId,
        )
        const payloads: unknown[] = await triggerHooks.executeTrigger({
            projectId,
            flowVersion,
            payload,
            simulate: false,
        })

        const savePayloads = payloads.map((payload) => 
            triggerEventService.saveEvent({
                flowId: flow.id,
                payload,
                projectId,
            }).catch((e) =>
                logger.error(
                    e,
                    '[WebhookService#callback] triggerEventService.saveEvent',
                ),
            ),
        )

        await Promise.all(savePayloads)

        const filterPayloads = await dedupeService.filterUniquePayloads(
            flowVersion.id,
            payloads,
        )

        const createFlowRuns = filterPayloads.map((payload) =>
            flowRunService.start({
                environment: RunEnvironment.PRODUCTION,
                flowVersionId: flowVersion.id,
                payload,
                synchronousHandlerId,
                progressUpdateType: ProgressUpdateType.WEBHOOK_RESPONSE,
                projectId,
                executionType: ExecutionType.BEGIN,
            }),
        )

        return Promise.all(createFlowRuns)
    },

    async simulationCallback({ flow, payload }: CallbackParams): Promise<void> {
        const { projectId } = flow
        const flowVersion = await getLatestFlowVersionOrThrow(flow.id, projectId)

        const events = await triggerHooks.executeTrigger({
            projectId,
            flowVersion,
            payload,
            simulate: true,
        })

        if (events.length === 0) {
            return
        }

        logger.debug(
            events,
            `[WebhookService#simulationCallback] events, flowId=${flow.id}`,
        )

        const eventSaveJobs = events.map((event) =>
            triggerEventService.saveEvent({
                flowId: flow.id,
                projectId,
                payload: event,
            }),
        )

        await Promise.all(eventSaveJobs)

        await webhookSimulationService.delete({ flowId: flow.id, projectId })
    },

    async getWebhookPrefix(): Promise<string> {
        return `${await getServerUrl()}v1/webhooks`
    },

    async getWebhookUrl({
        flowId,
        simulate,
    }: GetWebhookUrlParams): Promise<string> {
        const suffix: WebhookUrlSuffix = simulate ? '/test' : ''
        const webhookPrefix = await this.getWebhookPrefix()
        return `${webhookPrefix}/${flowId}${suffix}`
    },
}

const getLatestFlowVersionOrThrow = async (
    flowId: FlowId,
    projectId: ProjectId,
): Promise<FlowVersion> => {
    const flowVersion = await flowVersionService.getFlowVersionOrThrow({
        flowId,
        versionId: undefined,
    })

    if (isNil(flowVersion)) {
        logger.error(
            `[WebhookService#getLatestFlowVersionOrThrow] error=flow_version_not_found flowId=${flowId} projectId=${projectId}`,
        )

        throw new ActivepiecesError({
            code: ErrorCode.FLOW_NOT_FOUND,
            params: {
                id: flowId,
            },
        })
    }

    return flowVersion
}

type WebhookUrlSuffix = '' | '/test'

type GetWebhookUrlParams = {
    flowId: FlowId
    simulate?: boolean
}

type CallbackParams = {
    flow: Flow
    payload: EventPayload
}

type HandshakeParams = {
    flow: Flow
    payload: EventPayload
    simulate: boolean
}

type SyncParams = {
    flow: Flow
    payload: EventPayload
    synchronousHandlerId?: string
}
