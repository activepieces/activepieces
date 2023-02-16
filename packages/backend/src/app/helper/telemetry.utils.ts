import { PostHog } from 'posthog-node'
import { SystemProp } from "./system/system-prop";
import { system } from "./system/system";
import { ProjectId, TelemetryEvent, User, UserId } from '@activepieces/shared';
import { projectService } from '../project/project.service';


const telemetryEnabled = system.getBoolean(SystemProp.TELEMETRY_ENABLED) ?? true;

const client = new PostHog(
    'phc_7F92HoXJPeGnTKmYv0eOw62FurPMRW9Aqr0TPrDzvHh'
)

export const telemetry = {
    async identify(user: User, projectId: ProjectId): Promise<void> {
        client.identify({
            distinctId: user.id,
            properties: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                projectId: projectId
            }
        })
    },
    async trackProject(projectId: ProjectId, event: TelemetryEvent): Promise<void> {
        if (!telemetryEnabled) {
            return;
        }
        const project = await projectService.getOne(projectId);
        client.capture({
            distinctId: project.ownerId,
            event: event.name,
            properties: {
                ...event.payload
            }
        })

    },
    async track(userId: UserId, event: TelemetryEvent): Promise<void> {
        if (!telemetryEnabled) {
            return;
        }
        client.capture({
            distinctId: userId,
            event: event.name,
            properties: {
                ...event.payload
            }
        })

    }
}