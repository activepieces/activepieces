import { Analytics } from '@segment/analytics-node'
import { flagService } from '../flags/flag.service'
import { projectService } from '../project/project-service'
import { getEdition } from './secret-helper'
import { logger, system, SystemProp } from '@activepieces/server-shared'
import { ProjectId, TelemetryEvent, User, UserId } from '@activepieces/shared'

const telemetryEnabled = system.getBoolean(SystemProp.TELEMETRY_ENABLED)

const analytics = new Analytics({ writeKey: '42TtMD2Fh9PEIcDO2CagCGFmtoPwOmqK' })

export const telemetry = {
    async identify(user: User, projectId: ProjectId): Promise<void> {
        if (!telemetryEnabled) {
            return
        }
        const identify = {
            userId: user.id,
            traits: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                projectId,
                firstSeenAt: user.created,
                ...(await getMetadata()),
            },
        }
        analytics.identify(identify)
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
            logger.error(e, '[Telemetry#trackProject] this.trackUser'),
        )
    },
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
        analytics.track(payloadEvent)
    },
}

async function getMetadata() {
    const currentVersion = await flagService.getCurrentRelease()
    const edition = getEdition()
    return {
        activepiecesVersion: currentVersion,
        activepiecesEnvironment: system.get(SystemProp.ENVIRONMENT),
        activepiecesEdition: edition,
    }
}
