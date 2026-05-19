import { FlowStatus } from '../../automation/flows/flow'
import { FlowOperationType } from '../../automation/flows/operations'
import { apId } from '../../core/common/id-generator'
import { PlatformId } from '../../management/platform/platform.model'
import { ProjectId } from '../../management/project/project'
import {
    ApplicationEvent,
    ApplicationEventName,
    AuthenticationEvent,
    ConnectionEvent,
    FlowActivatedEvent,
    FlowCreatedEvent,
    FlowDeactivatedEvent,
    FlowDeletedEvent,
    FlowPublishedEvent,
    FlowRunEvent,
    FlowUpdatedEvent,
    FolderEvent,
    ProjectReleaseEvent,
    ProjectRoleEvent,
    SigningKeyEvent,
    SignUpEvent,
} from './index'

export const buildMockEvent = ({ event, platformId, projectId }: BuildMockEventParams): ApplicationEvent => {
    const isoNow = new Date().toISOString()
    const baseEnvelope = {
        id: apId(),
        created: isoNow,
        updated: isoNow,
        ip: '127.0.0.1',
        platformId,
        projectId,
        userId: apId(),
    }
    const project = { displayName: 'Dream Department' }
    const flow = { id: apId(), externalId: apId(), created: isoNow, updated: isoNow }
    const flowVersion = {
        id: apId(),
        displayName: 'Sample flow',
        flowId: flow.id,
        created: isoNow,
        updated: isoNow,
    }
    const user = {
        id: apId(),
        email: 'sample@example.com',
        firstName: 'Sample',
        lastName: 'User',
    }

    switch (event) {
        case ApplicationEventName.FLOW_RUN_STARTED:
        case ApplicationEventName.FLOW_RUN_FINISHED:
        case ApplicationEventName.FLOW_RUN_RESUMED:
        case ApplicationEventName.FLOW_RUN_RETRIED: {
            const mock: FlowRunEvent = {
                ...baseEnvelope,
                action: event,
                data: {
                    flowRun: {
                        id: apId(),
                        startTime: isoNow,
                        finishTime: isoNow,
                        duration: 1234,
                        environment: 'PRODUCTION',
                        flowId: flow.id,
                        flowVersionId: flowVersion.id,
                        flowDisplayName: flowVersion.displayName,
                        status: event === ApplicationEventName.FLOW_RUN_FINISHED ? 'FAILED' : 'RUNNING',
                    },
                    project,
                },
            }
            return mock
        }
        case ApplicationEventName.FLOW_CREATED: {
            const mock: FlowCreatedEvent = {
                ...baseEnvelope,
                action: ApplicationEventName.FLOW_CREATED,
                data: { flow, project },
            }
            return mock
        }
        case ApplicationEventName.FLOW_DELETED: {
            const mock: FlowDeletedEvent = {
                ...baseEnvelope,
                action: ApplicationEventName.FLOW_DELETED,
                data: { flow, flowVersion, project },
            }
            return mock
        }
        case ApplicationEventName.FLOW_UPDATED: {
            const mock: FlowUpdatedEvent = {
                ...baseEnvelope,
                action: ApplicationEventName.FLOW_UPDATED,
                data: {
                    flow,
                    flowVersion,
                    request: {
                        type: FlowOperationType.LOCK_AND_PUBLISH,
                        request: { status: FlowStatus.ENABLED },
                    },
                    project,
                },
            }
            return mock
        }
        case ApplicationEventName.FLOW_PUBLISHED: {
            const mock: FlowPublishedEvent = {
                ...baseEnvelope,
                action: ApplicationEventName.FLOW_PUBLISHED,
                data: { flow, flowVersion, project },
            }
            return mock
        }
        case ApplicationEventName.FLOW_ACTIVATED: {
            const mock: FlowActivatedEvent = {
                ...baseEnvelope,
                action: ApplicationEventName.FLOW_ACTIVATED,
                data: { flow, flowVersion, project },
            }
            return mock
        }
        case ApplicationEventName.FLOW_DEACTIVATED: {
            const mock: FlowDeactivatedEvent = {
                ...baseEnvelope,
                action: ApplicationEventName.FLOW_DEACTIVATED,
                data: { flow, flowVersion, project },
            }
            return mock
        }
        case ApplicationEventName.FOLDER_CREATED:
        case ApplicationEventName.FOLDER_UPDATED:
        case ApplicationEventName.FOLDER_DELETED: {
            const mock: FolderEvent = {
                ...baseEnvelope,
                action: event,
                data: {
                    folder: {
                        id: apId(),
                        displayName: 'Sample folder',
                        created: isoNow,
                        updated: isoNow,
                    },
                    project,
                },
            }
            return mock
        }
        case ApplicationEventName.CONNECTION_UPSERTED:
        case ApplicationEventName.CONNECTION_DELETED: {
            const mock: ConnectionEvent = {
                ...baseEnvelope,
                action: event,
                data: {
                    connection: {
                        id: apId(),
                        displayName: 'Sample connection',
                        externalId: 'sample-connection',
                        pieceName: '@activepieces/piece-sample',
                        status: 'ACTIVE',
                        type: 'CUSTOM_AUTH',
                        created: isoNow,
                        updated: isoNow,
                    },
                    project,
                },
            }
            return mock
        }
        case ApplicationEventName.USER_SIGNED_IN:
        case ApplicationEventName.USER_PASSWORD_RESET:
        case ApplicationEventName.USER_EMAIL_VERIFIED: {
            const mock: AuthenticationEvent = {
                ...baseEnvelope,
                action: event,
                data: { user },
            }
            return mock
        }
        case ApplicationEventName.USER_SIGNED_UP: {
            const mock: SignUpEvent = {
                ...baseEnvelope,
                action: ApplicationEventName.USER_SIGNED_UP,
                data: { source: 'credentials', user },
            }
            return mock
        }
        case ApplicationEventName.SIGNING_KEY_CREATED: {
            const mock: SigningKeyEvent = {
                ...baseEnvelope,
                action: ApplicationEventName.SIGNING_KEY_CREATED,
                data: {
                    signingKey: {
                        id: apId(),
                        displayName: 'Sample signing key',
                        created: isoNow,
                        updated: isoNow,
                    },
                },
            }
            return mock
        }
        case ApplicationEventName.PROJECT_ROLE_CREATED:
        case ApplicationEventName.PROJECT_ROLE_UPDATED:
        case ApplicationEventName.PROJECT_ROLE_DELETED: {
            const mock: ProjectRoleEvent = {
                ...baseEnvelope,
                action: event,
                data: {
                    projectRole: {
                        id: apId(),
                        created: isoNow,
                        updated: isoNow,
                        name: 'Sample role',
                        permissions: [],
                        platformId,
                    },
                },
            }
            return mock
        }
        case ApplicationEventName.PROJECT_RELEASE_CREATED: {
            const mock: ProjectReleaseEvent = {
                ...baseEnvelope,
                action: ApplicationEventName.PROJECT_RELEASE_CREATED,
                data: {
                    release: {
                        name: 'v1.0.0',
                        description: 'Sample release',
                        type: 'PROJECT',
                        projectId: projectId ?? apId(),
                    },
                },
            }
            return mock
        }
    }
}

export type BuildMockEventParams = {
    event: ApplicationEventName
    platformId: PlatformId
    projectId?: ProjectId
}
