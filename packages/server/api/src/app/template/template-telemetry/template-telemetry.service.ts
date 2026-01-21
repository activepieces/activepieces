import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ApEdition, isNil, TemplateTelemetryEvent, TemplateTelemetryEventType, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'

const CLOUD_TELEMETRY_URL = 'https://cloud.activepieces.com/api/v1/templates-telemetry'
const INTERNAL_TELEMETRY_URL = 'https://template-manager.activepieces.com/api/public/analytics/event'
const TEMPLATE_TELEMETRY_API_KEY = system.get(AppSystemProp.TEMPLATE_MANAGER_API_KEY)
const TEMPLATE_TELEMETRY_API_KEY_HEADER = 'X-API-Key'

export const templateTelemetryService = (log: FastifyBaseLogger) => ({
    sendEvent(event: TemplateTelemetryEvent): void {
        const telemetryEnabled = system.getBoolean(AppSystemProp.TELEMETRY_ENABLED)
        if (!telemetryEnabled) {
            log.debug('Telemetry is disabled, skipping template telemetry event')
            return
        }

        const edition = system.getEdition()
        if (edition !== ApEdition.CLOUD) {
            rejectedPromiseHandler(sendToCloud(event), log)
            return
        }

        rejectedPromiseHandler(sendToInternal(event, log), log)
    },
})

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
