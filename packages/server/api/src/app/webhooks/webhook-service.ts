import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { triggerHooks } from '../flows/trigger'
import { dedupeService } from '../flows/trigger/dedupe'
import { triggerEventService } from '../flows/trigger-events/trigger-event.service'
import { getServerUrl } from '../helper/network-utils'
import { WebhookResponse } from '@activepieces/pieces-framework'
import { logger, rejectedPromiseHandler } from '@activepieces/server-shared'
import { EventPayload,
    ExecutionType,
    Flow,
    FlowId,
    FlowRun,
    FlowVersion,
    isNil,
    ProgressUpdateType,
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
                    removeSampleData: false,
                    removeConnectionsName: false,
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
    async extractPayloadAndSave({ flowVersion, payload, projectId }: SaveSampleDataParams): Promise<unknown[]> {
        const payloads: unknown[] = await triggerHooks.executeTrigger({
            projectId,
            flowVersion,
            payload,
            simulate: false,
        })

        const savePayloads = payloads.map((payload) => 
            triggerEventService.saveEvent({
                flowId: flowVersion.flowId,
                payload,
                projectId,
            }).catch((e) =>
                logger.error(
                    e,
                    '[WebhookService#callback] triggerEventService.saveEvent',
                ),
            ),
        )

        const filterPayloads = await dedupeService.filterUniquePayloads(
            flowVersion.id,
            payloads,
        )

        rejectedPromiseHandler(Promise.all(savePayloads))
        return filterPayloads
    },
    async startAndSaveRuns({
        projectId,
        flowVersion,
        filteredPayloads,
        synchronousHandlerId,
    }: SyncParams): Promise<FlowRun[]> {
        logger.info(`[WebhookService#callback] flowId=${flowVersion.id}`)
        const createFlowRuns = filteredPayloads.map((payload) =>
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


type WebhookUrlSuffix = '' | '/test'

type GetWebhookUrlParams = {
    flowId: FlowId
    simulate?: boolean
}

type SaveSampleDataParams = {
    projectId: string
    flowVersion: FlowVersion
    payload: EventPayload
}


type HandshakeParams = {
    flow: Flow
    payload: EventPayload
    simulate: boolean
}

type SyncParams = {
    projectId: string
    flowVersion: FlowVersion
    filteredPayloads: unknown[]
    synchronousHandlerId?: string
}
