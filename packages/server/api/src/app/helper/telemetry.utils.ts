import { AIProviderName, isNil, ProjectId, spreadIfDefined, UserId } from '@activepieces/core-utils'
import { apVersionUtil } from '@activepieces/server-utils'
import { ApEdition, AppInstance, FlowRunStatus, GetSystemHealthChecksResponse, MachineInformation, pickTelemetryPii, RunEnvironment, TelemetryEvent, User, UserIdentity } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { PostHog } from 'posthog-node'
import { platformConfigurationService } from '../platform/platform-configuration.service'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

let posthogInstance: PostHog | null = null
function getPostHog(): PostHog {
    if (!posthogInstance) {
        posthogInstance = new PostHog('phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh', {
            host: 'https://us.i.posthog.com',
            maxQueueSize: POSTHOG_MAX_QUEUE_SIZE,
        })
    }
    return posthogInstance
}

export const LICENSE_KEY_EVENTS_FLUSH_BATCH_SIZE = 5_000
const POSTHOG_MAX_QUEUE_SIZE = 20_000

export const telemetry = (log: FastifyBaseLogger) => ({
    async identify({ identity, platformId, user, projectId }: IdentifyParams): Promise<void> {
        if (!await platformConfigurationService(log).isProductTelemetryEnabled({ platformId })) {
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
    async trackPlatform({ platformId, event }: TrackPlatformParams): Promise<void> {
        if (!await platformConfigurationService(log).isProductTelemetryEnabled({ platformId })) {
            return
        }
        const platform = await platformService(log).getOneOrThrow(platformId)
        await captureUserEvent({ userId: platform.ownerId, platformId, event, log })
    },
    async trackProject({ projectId, event }: TrackProjectParams): Promise<void> {
        const project = await projectService(log).getOne(projectId)
        if (isNil(project)) {
            return
        }
        return this.trackUser({ userId: project.ownerId, platformId: project.platformId, event })
    },
    async trackIdentity({ identityId, platformId, event }: TrackIdentityParams): Promise<void> {
        if (!isNil(platformId)) {
            return this.trackUser({ userId: identityId, platformId, event })
        }
        if (system.getEdition() !== ApEdition.CLOUD) {
            return
        }
        await captureUserEvent({ userId: identityId, platformId, event, log })
    },
    async trackUser({ userId, platformId, event }: TrackUserParams): Promise<void> {
        if (!await platformConfigurationService(log).isProductTelemetryEnabled({ platformId })) {
            return
        }
        await captureUserEvent({ userId, platformId, event, log })
    },
})

export function captureLicenseKeyEvent({ licenseKey, event, properties }: CaptureLicenseKeyEventParams): void {
    getPostHog().capture({
        distinctId: licenseKey,
        event,
        properties,
    })
}
export async function flushLicenseKeyPostHogEvents(): Promise<void> {
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

async function captureUserEvent({ userId, platformId, event, log }: CaptureUserEventParams): Promise<void> {
    const payloadEvent = {
        distinctId: userId,
        event: event.name,
        properties: {
            ...event.payload,
            ...(await getMetadata()),
            datetime: new Date().toISOString(),
        },
        ...spreadIfDefined('groups', isNil(platformId) ? null : { platform: platformId }),
    }
    log.info(payloadEvent, '[Telemetry#captureUserEvent] sending event')
    getPostHog().capture(payloadEvent)
}

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

export enum LicenseKeyPostHogEvents {
    AI_USAGE_PER_RUN = 'ai_usage_per_run',
    CHAT_MESSAGE = 'chat_message',
    PLATFORM_SETUP_REPORT = 'platform_setup_report',
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

/**
 * The setup report carries only what helps us diagnose a customer's problem and anticipate the
 * blast radius of a change we are about to ship — the shape of a deployment (how many app replicas
 * and workers, how big, how configured, what release) rather than anything about the people using
 * it or the work it runs. Host identifiers are deliberately excluded: hostname and worker IP
 * identify a machine without telling us anything we would act on.
 *
 * Before adding a field, check it against both halves of that test. "Would this let us answer a
 * support question, or tell us who a change is about to break?" If neither, it does not belong here.
 */
export type SetupReportApp = Pick<AppInstance, 'cpuCores' | 'ramTotalBytes' | 'diskTotalBytes' | 'diskPercentage' | 'version' | 'eventLoopDelayMs'>

export type SetupReportWorker = Pick<MachineInformation, 'totalCpuCores' | 'totalAvailableRamInBytes' | 'diskInfo' | 'workerProps'>

export type SetupReportHealth = Pick<GetSystemHealthChecksResponse, 'database' | 'release'>

export type SetupReportProperties = {
    platformId: string
    edition: ApEdition
    reportedAt: string
    apps?: SetupReportApp[]
    workers?: SetupReportWorker[]
    workersTotal?: number
    health?: SetupReportHealth
}

export type LicenseKeyEventPayload =
    | { event: LicenseKeyPostHogEvents.AI_USAGE_PER_RUN, properties: AiUsagePerRunProperties }
    | { event: LicenseKeyPostHogEvents.TOTAL_RUNS_PER_DAY, properties: TotalRunsPerDayProperties }
    | { event: LicenseKeyPostHogEvents.CHAT_MESSAGE, properties: ChatMessageProperties }
    | { event: LicenseKeyPostHogEvents.PLATFORM_SETUP_REPORT, properties: SetupReportProperties }

type CaptureLicenseKeyEventParams = { licenseKey: string } & LicenseKeyEventPayload

type IdentifyParams = {
    identity: UserIdentity
    platformId: string
    user?: User
    projectId?: ProjectId
}

type TrackPlatformParams = {
    platformId: string
    event: TelemetryEvent
}

type TrackProjectParams = {
    projectId: ProjectId
    event: TelemetryEvent
}

type TrackIdentityParams = {
    identityId: string
    platformId: string | null
    event: TelemetryEvent
}

type TrackUserParams = {
    userId: UserId
    platformId: string
    event: TelemetryEvent
}

type CaptureUserEventParams = {
    userId: UserId
    platformId: string | null
    event: TelemetryEvent
    log: FastifyBaseLogger
}
