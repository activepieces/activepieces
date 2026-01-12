import { ProjectId, TelemetryEvent, User, UserId, UserIdentity } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

/**
 * No-op telemetry utility - telemetry has been removed from this fork.
 * All methods are stubs that do nothing.
 */
export const telemetry = (_log: FastifyBaseLogger) => ({
    async identify(_user: User, _identity: UserIdentity, _projectId: ProjectId): Promise<void> {
        // No-op: telemetry disabled
    },
    async trackPlatform(_platformId: ProjectId, _event: TelemetryEvent): Promise<void> {
        // No-op: telemetry disabled
    },
    async trackProject(
        _projectId: ProjectId,
        _event: TelemetryEvent,
    ): Promise<void> {
        // No-op: telemetry disabled
    },
    isEnabled: () => false,
    async trackUser(_userId: UserId, _event: TelemetryEvent): Promise<void> {
        // No-op: telemetry disabled
    },
})
