import { AIProviderName, ProjectId, UserId } from '@activepieces/core-utils'
import { apVersionUtil } from '@activepieces/server-utils'
import { ApEdition, FlowRunStatus, pickTelemetryPii, RunEnvironment, TelemetryEvent, User, UserIdentity } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { PostHog } from 'posthog-node'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

const telemetryEnabled = system.getBoolean(AppSystemProp.TELEMETRY_ENABLED)

let posthogInstance: PostHog | null = null
function getPostHog(): PostHog {
    if (!posthogInstance) {
        posthogInstance = new PostHog('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
            host: 'https://us.i.posthog.com',
            maxQueueSize: BILLING_EVENTS_MAX_QUEUE_SIZE,
        })
    }
    return posthogInstance
}

export const BILLING_EVENTS_FLUSH_BATCH_SIZE = 10_000
const BILLING_EVENTS_MAX_QUEUE_SIZE = 20_000

export const telemetry = (log: FastifyBaseLogger) => ({
    async identify(identity: UserIdentity, user?: User, projectId?: ProjectId): Promise<void> {
        if (!telemetryEnabled) {
            return
        }
        getPostHog().identify({
            distinctId: user?.id ?? identity.id,
            properties: {
                ...pickTelemetryPii({
                    edition: system.getEdition(),
                    email: identity.email,
                    firstName: identity.firstName,
                    lastName: identity.lastName,
                }),
                projectId,
                firstSeenAt: user?.created ?? identity.created,
                ...(await getMetadata()),
            },
        })
    },
    async trackPlatform(platformId: ProjectId, event: TelemetryEvent): Promise<void> {
        if (!telemetryEnabled) {
            return
        }
        const platform = await platformService(log).getOneOrThrow(platformId)
        await this.trackUser(platform.ownerId, event, { platform: platformId })
    },
    async trackProject(
        projectId: ProjectId,
        event: TelemetryEvent,
    ): Promise<void> {
        if (!telemetryEnabled) {
            return
        }
        const project = await projectService(log).getOne(projectId)
        return this.trackUser(project!.ownerId, event, { platform: project!.platformId })
    },
    isEnabled: () => telemetryEnabled,
    async trackUser(userId: UserId, event: TelemetryEvent, groups?: Record<string, string>): Promise<void> {
        if (!telemetryEnabled) {
            return
        }
        const payloadEvent = {
            distinctId: userId,
            event: event.name,
            properties: {
                ...event.payload,
                ...(await getMetadata()),
                datetime: new Date().toISOString(),
            },
            groups,
        }
        log.info(payloadEvent, '[Telemetry#trackUser] sending event')
        getPostHog().capture(payloadEvent)
    },
})

export function captureBillingEvent({ licenseKey, event, properties }: CaptureBillingEventParams): void {
    getPostHog().capture({
        distinctId: licenseKey,
        event,
        properties,
    })
}
export async function flushBillingEvents(): Promise<void> {
    if (posthogInstance !== null) {
        await posthogInstance.flush()
    }
}

export async function shutdownTelemetry(): Promise<void> {
    if (posthogInstance) {
        await posthogInstance.shutdown()
    }
}

const DEDUPE_MAX_ENTRIES = 50_000
const dailyEventDedupe = new Map<string, string>()

function onceToday(key: string): boolean {
    const today = new Date().toISOString().slice(0, 10)
    if (dailyEventDedupe.get(key) === today) {
        return false
    }
    if (dailyEventDedupe.size >= DEDUPE_MAX_ENTRIES) {
        dailyEventDedupe.clear()
    }
    dailyEventDedupe.set(key, today)
    return true
}

export const telemetryDedupe = { onceToday }

async function getMetadata() {
    const currentVersion = apVersionUtil.getCurrentRelease()
    const edition = system.getEdition()
    return {
        activepiecesVersion: currentVersion,
        activepiecesEnvironment: system.get(AppSystemProp.ENVIRONMENT),
        activepiecesEdition: edition,
        source_site: 'product',
    }
}

export enum BillingEvents {
    AI_USAGE_PER_RUN = 'ai_usage_per_run',
    CHAT_MESSAGE = 'chat_message',
    TOTAL_RUNS_PER_DAY = 'total_runs_per_day',
}

export type AiUsagePerRunProperties = {
    platformId: string
    projectId: string
    edition: ApEdition
    flowRunId: string
    flowId: string
    status: FlowRunStatus
    environment: RunEnvironment
    messages: number
    toolCalls: number
    breakdown: Array<{ provider: string, model: string, messages: number, toolCalls: number }>
}

export type TotalRunsPerDayProperties = {
    platform_id: string
    active_flows: number
    projects: number
    users: number
    daily_executions: Array<{ date: string, count: number }>
    reported_at: string
}

export type ChatMessageProperties = {
    provider: AIProviderName | null
    model: string | null
    toolsUsed: number
}

type CaptureBillingEventParams = { licenseKey: string } & (
    | { event: BillingEvents.AI_USAGE_PER_RUN, properties: AiUsagePerRunProperties }
    | { event: BillingEvents.TOTAL_RUNS_PER_DAY, properties: TotalRunsPerDayProperties }
    | { event: BillingEvents.CHAT_MESSAGE, properties: ChatMessageProperties }
)
