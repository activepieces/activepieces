import {
    ApEnvironment,
    EventPayload,
    Flow,
    FlowId,
    FlowVersion,
    ProjectId,
    RunEnvironment,
} from '@activepieces/shared'
import { flowRunService } from '../flows/flow-run/flow-run-service'
import { flowVersionService } from '../flows/flow-version/flow-version.service'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { triggerUtils } from '../helper/trigger-utils'
import { flowRepo } from '../flows/flow/flow.repo'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { getPublicIp } from '../helper/public-ip-utils'
import { triggerEventService } from '../flows/trigger-events/trigger-event.service'
import { isEmpty, isNil } from 'lodash'
import { logger } from '../helper/logger'
import { webhookSimulationService } from './webhook-simulation/webhook-simulation-service'

export const webhookService = {
    async callback({ flowId, payload }: CallbackParams): Promise<void> {
        const flow = await getFlowOrThrow(flowId)
        const { projectId } = flow
        const flowVersion = await getLatestFlowVersionOrThrow(flowId, projectId)

        triggerEventService.saveEvent({
            flowId,
            payload,
            projectId,
        })

        const payloads: unknown[] = await triggerUtils.executeTrigger({
            projectId,
            flowVersion,
            payload,
            simulate: false,
        })

        const createFlowRuns = payloads.map((payload) =>
            flowRunService.start({
                environment: RunEnvironment.PRODUCTION,
                flowVersionId: flowVersion.id,
                payload,
            }),
        )

        await Promise.all(createFlowRuns)
    },

    async simulationCallback({ flowId, payload }: CallbackParams): Promise<void> {
        const flow = await getFlowOrThrow(flowId)
        const { projectId } = flow
        const flowVersion = await getLatestFlowVersionOrThrow(flowId, projectId)

        const events = await triggerUtils.executeTrigger({
            projectId,
            flowVersion,
            payload,
            simulate: true,
        })

        if (isEmpty(events)) {
            return
        }

        logger.debug(events, `[WebhookService#simulationCallback] events, flowId=${flowId}`)

        const eventSaveJobs = events.map(event => triggerEventService.saveEvent({
            flowId,
            projectId,
            payload: event,
        }))

        await Promise.all(eventSaveJobs)

        await webhookSimulationService.delete({ flowId, projectId })
    },

    async getWebhookPrefix(): Promise<string> {
        const environment = system.get(SystemProp.ENVIRONMENT)

        let url = environment === ApEnvironment.PRODUCTION
            ? system.get(SystemProp.FRONTEND_URL)
            : system.get(SystemProp.WEBHOOK_URL)

        // Localhost doesn't work with webhooks, so we need try to use the public ip
        if (extractHostname(url) == 'localhost' && environment === ApEnvironment.PRODUCTION) {
            url = `http://${(await getPublicIp()).ip}`
        }

        const slash = url.endsWith('/') ? '' : '/'
        const redirect = environment === ApEnvironment.PRODUCTION ? 'api/' : ''

        return `${url}${slash}${redirect}v1/webhooks`
    },

    async getWebhookUrl({ flowId, simulate }: GetWebhookUrlParams): Promise<string> {
        const suffix: WebhookUrlSuffix = simulate ? '/simulate' : ''
        const webhookPrefix = await this.getWebhookPrefix()
        return `${webhookPrefix}/${flowId}${suffix}`
    },
}

function extractHostname(url: string): string | null {
    try {
        const hostname = new URL(url).hostname
        return hostname
    }
    catch (e) {
        return null
    }
}

const getLatestFlowVersionOrThrow = async (flowId: FlowId, projectId: ProjectId): Promise<FlowVersion> => {
    const flowVersionId = undefined
    const includeArtifacts = false

    const flowVersion = await flowVersionService.getFlowVersion(
        projectId,
        flowId,
        flowVersionId,
        includeArtifacts,
    )

    if (isNil(flowVersion)) {
        logger.error(`[WebhookService#getLatestFlowVersionOrThrow] error=flow_version_not_found flowId=${flowId} projectId=${projectId}`)

        throw new ActivepiecesError({
            code: ErrorCode.FLOW_NOT_FOUND,
            params: {
                id: flowId,
            },
        })
    }

    return flowVersion
}

const getFlowOrThrow = async (flowId: FlowId): Promise<Flow> => {
    if (isNil(flowId)) {
        logger.error('[WebhookService#getFlowOrThrow] error=flow_id_is_undefined')
        throw new ActivepiecesError({
            code: ErrorCode.FLOW_NOT_FOUND,
            params: {
                id: undefined,
            },
        })
    }

    const flow = await flowRepo.findOneBy({ id: flowId })

    if (isNil(flow)) {
        logger.error(`[WebhookService#getFlowOrThrow] error=flow_not_found flowId=${flowId}`)

        throw new ActivepiecesError({
            code: ErrorCode.FLOW_NOT_FOUND,
            params: {
                id: flowId,
            },
        })
    }

    return flow
}

type WebhookUrlSuffix = '' | '/simulate'

type GetWebhookUrlParams = {
    flowId: FlowId
    simulate?: boolean
}

type CallbackParams = {
    flowId: FlowId
    payload: EventPayload
}
