import { isNil, tryCatch } from '@activepieces/core-utils'
import { ApEdition, TemplateTelemetryEvent, TemplateTelemetryEventType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { rejectedPromiseHandler } from '../../helper/promise-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { platformConfigurationService } from '../../platform/platform-configuration.service'
import { projectService } from '../../project/project-service'

const CLOUD_TELEMETRY_URL = 'https://cloud.activepieces.com/api/v1/templates-telemetry'
const INTERNAL_TELEMETRY_URL = 'https://template-manager.activepieces.com/api/public/analytics/event'
const TEMPLATE_TELEMETRY_API_KEY = system.get(AppSystemProp.TEMPLATE_MANAGER_API_KEY)
const TEMPLATE_TELEMETRY_API_KEY_HEADER = 'X-API-Key'

export const templateTelemetryService = (log: FastifyBaseLogger) => ({
    sendEvent({ event, projectId }: SendEventParams): void {
        rejectedPromiseHandler(dispatchForProject({ event, projectId, log }), log)
    },

    sendEventForPlatform({ event, platformId }: SendEventForPlatformParams): void {
        rejectedPromiseHandler(dispatchForPlatform({ event, platformId, log }), log)
    },
})

async function dispatchForProject({ event, projectId, log }: DispatchForProjectParams): Promise<void> {
    const project = await projectService(log).getOne(projectId)
    if (isNil(project)) {
        return
    }
    return dispatchForPlatform({ event, platformId: project.platformId, log })
}

async function dispatchForPlatform({ event, platformId, log }: DispatchForPlatformParams): Promise<void> {
    if (!isNil(platformId)) {
        const enabled = await platformConfigurationService(log).isProductTelemetryEnabled({ platformId })
        if (!enabled) {
            log.debug('Product analytics is disabled, skipping template telemetry event')
            return
        }
    }
    return dispatch({ event, log })
}

async function dispatch({ event, log }: DispatchParams): Promise<void> {
    if (system.getEdition() !== ApEdition.CLOUD) {
        return sendToCloud(event)
    }
    return sendToInternal(event, log)
}

async function sendToCloud(event: TemplateTelemetryEvent): Promise<void> {
    const url = `${CLOUD_TELEMETRY_URL}/event`
    await tryCatch(() => fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
    }))
}

async function sendToInternal(event: TemplateTelemetryEvent, log: FastifyBaseLogger): Promise<void> {
    if (isNil(TEMPLATE_TELEMETRY_API_KEY)) {
        log.debug('Template telemetry API key is not set, skipping event')
        return
    }

    const { url, body } = getEventConfig(event)
    
    await tryCatch(async () => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [TEMPLATE_TELEMETRY_API_KEY_HEADER]: TEMPLATE_TELEMETRY_API_KEY,
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        })
        log.info({ eventType: event.eventType, response: response.status }, 'Template telemetry event sent')
    })
}

function getEventConfig(event: TemplateTelemetryEvent): { url: string, body?: Record<string, unknown> } {
    switch (event.eventType) {
        case TemplateTelemetryEventType.VIEW:
        case TemplateTelemetryEventType.INSTALL:
        case TemplateTelemetryEventType.ACTIVATE:
        case TemplateTelemetryEventType.DEACTIVATE:
        case TemplateTelemetryEventType.EXPLORE_VIEW:
            return {
                url: INTERNAL_TELEMETRY_URL,
                body: event,
            }
        default:
            throw new Error(`Unknown template telemetry event type: ${(event as { eventType: string }).eventType}`)
    }
}

type SendEventParams = {
    event: TemplateTelemetryEvent
    projectId: string
}

type SendEventForPlatformParams = {
    event: TemplateTelemetryEvent
    platformId: string | null
}

type DispatchForProjectParams = SendEventParams & {
    log: FastifyBaseLogger
}

type DispatchForPlatformParams = SendEventForPlatformParams & {
    log: FastifyBaseLogger
}

type DispatchParams = {
    event: TemplateTelemetryEvent
    log: FastifyBaseLogger
}
