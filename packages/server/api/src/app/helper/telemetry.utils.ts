import { AppSystemProp, apVersionUtil } from '@activepieces/server-shared'
import { ProjectId, TelemetryEvent, User, UserId, UserIdentity } from '@activepieces/shared'
import { Analytics } from '@segment/analytics-node'
import { FastifyBaseLogger } from 'fastify'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { system } from './system/system'

const telemetryEnabled = system.getBoolean(AppSystemProp.TELEMETRY_ENABLED)

const analytics = new Analytics({ writeKey: 'KOEkEwBpW1yOw75Evcfg06H0DidqJXzd' })

export const telemetry = (log: FastifyBaseLogger) => ({
    async identify(user: User, identity: UserIdentity, projectId: ProjectId): Promise<void> {
        if (!telemetryEnabled) {
            return
        }
        const identify = {
            userId: user.id,
            traits: {
                email: identity.email,
                firstName: identity.firstName,
                lastName: identity.lastName,
                projectId,
                firstSeenAt: user.created,
                ...(await getMetadata()),
            },
        }
        analytics.identify(identify)
    },
    async trackPlatform(platformId: ProjectId, event: TelemetryEvent): Promise<void> {
        if (!telemetryEnabled) {
            return
        }
        const platform = await platformService.getOneOrThrow(platformId)
        await this.trackUser(platform.ownerId, event)
    },
    async trackProject(
        projectId: ProjectId,
        event: TelemetryEvent,
    ): Promise<void> {
        if (!telemetryEnabled) {
            return
        }
        const project = await projectService.getOne(projectId)
        this.trackUser(project!.ownerId, event).catch((e) =>
            log.error(e, '[Telemetry#trackProject] this.trackUser'),
        )
    },
    isEnabled: () => telemetryEnabled,
    async trackUser(userId: UserId, event: TelemetryEvent): Promise<void> {
        if (!telemetryEnabled) {
            return
        }
        const payloadEvent = {
            userId,
            event: event.name,
            properties: {
                ...event.payload,
                ...(await getMetadata()),
                datetime: new Date().toISOString(),
            },
        }
        log.info(payloadEvent, '[Telemetry#trackUser] sending event')
        analytics.track(payloadEvent)
    },
})

async function getMetadata() {
    const currentVersion = await apVersionUtil.getCurrentRelease()
    const edition = system.getEdition()
    return {
        activepiecesVersion: currentVersion,
        activepiecesEnvironment: system.get(AppSystemProp.ENVIRONMENT),
        activepiecesEdition: edition,
    }
}
