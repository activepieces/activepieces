import { ProjectMemberRole } from '@activepieces/shared'
import { ResourceAction, ResourceName } from './resources'

export enum Permission {
    READ_ACTIVITY = 'READ_ACTIVITY',
    READ_APP_CONNECTION = 'READ_APP_CONNECTION',
    WRITE_APP_CONNECTION = 'WRITE_APP_CONNECTION',
    READ_FLOW = 'READ_FLOW',
    WRITE_FLOW = 'WRITE_FLOW',
    READ_PROJECT_MEMBER = 'READ_PROJECT_MEMBER',
    WRITE_PROJECT_MEMBER = 'WRITE_PROJECT_MEMBER',
}

export const rolePermissions: Record<ProjectMemberRole, Permission[]> = {
    [ProjectMemberRole.ADMIN]: [
        Permission.READ_ACTIVITY,
        Permission.READ_APP_CONNECTION,
        Permission.WRITE_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.WRITE_FLOW,
        Permission.READ_PROJECT_MEMBER,
        Permission.WRITE_PROJECT_MEMBER,
    ],
    [ProjectMemberRole.EDITOR]: [
        Permission.READ_ACTIVITY,
        Permission.READ_APP_CONNECTION,
        Permission.WRITE_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.WRITE_FLOW,
        Permission.READ_PROJECT_MEMBER,
    ],
    [ProjectMemberRole.VIEWER]: [
        Permission.READ_ACTIVITY,
        Permission.READ_APP_CONNECTION,
        Permission.READ_FLOW,
        Permission.READ_PROJECT_MEMBER,
    ],
    [ProjectMemberRole.EXTERNAL_CUSTOMER]: [
        Permission.READ_ACTIVITY,
        Permission.READ_APP_CONNECTION,
        Permission.WRITE_APP_CONNECTION,
    ],
}

export const accessControlList: Record<Permission, AccessControl> = {
    [Permission.READ_ACTIVITY]: {
        resource: 'activities',
        actions: ['GET'],
    },
    [Permission.READ_APP_CONNECTION]: {
        resource: 'app-connections',
        actions: ['GET'],
    },
    [Permission.WRITE_APP_CONNECTION]: {
        resource: 'app-connections',
        actions: ['POST', 'DELETE'],
    },
    [Permission.READ_FLOW]: {
        resource: 'flows',
        actions: ['GET'],
    },
    [Permission.WRITE_FLOW]: {
        resource: 'flows',
        actions: ['POST', 'DELETE'],
    },
    [Permission.READ_PROJECT_MEMBER]: {
        resource: 'project-members',
        actions: ['GET'],
    },
    [Permission.WRITE_PROJECT_MEMBER]: {
        resource: 'project-members',
        actions: ['POST', 'DELETE'],
    },
}

type AccessControl = {
    resource: ResourceName
    actions: ResourceAction[]
}
