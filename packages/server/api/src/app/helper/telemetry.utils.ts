import { apVersionUtil } from '@activepieces/server-utils'
import { ProjectId, TelemetryEvent, User, UserId, UserIdentity } from '@activepieces/shared'
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
        })
    }
    return posthogInstance
}

export const telemetry = (log: FastifyBaseLogger) => ({
    async identify(identity: UserIdentity, user?: User, projectId?: ProjectId): Promise<void> {
        if (!telemetryEnabled) {
            return
        }
        getPostHog().identify({
            distinctId: user?.id ?? identity.id,
            properties: {
                email: identity.email,
                firstName: identity.firstName,
                lastName: identity.lastName,
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

export async function shutdownTelemetry(): Promise<void> {
    if (telemetryEnabled) {
        await getPostHog().shutdown()
    }
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
