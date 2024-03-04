import { Permission, ProjectMemberRole } from '@activepieces/shared'

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
