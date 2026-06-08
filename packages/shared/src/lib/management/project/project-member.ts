import { Permission } from '../../core/common/security/permission'

export enum DefaultProjectRole {
    ADMIN = 'Admin',
    EDITOR = 'Editor',
    VIEWER = 'Viewer',
}

const ALL_PERMISSIONS = Object.values(Permission)
const READ_ONLY_PERMISSIONS: Permission[] = [
    Permission.READ_APP_CONNECTION,
    Permission.READ_FLOW,
    Permission.READ_RUN,
    Permission.READ_FOLDER,
    Permission.READ_MCP,
    Permission.READ_PROJECT,
    Permission.READ_TABLE,
    Permission.READ_KNOWLEDGE_BASE,
    Permission.READ_VARIABLE,
    Permission.READ_INVITATION,
    Permission.READ_PROJECT_MEMBER,
    Permission.READ_PROJECT_RELEASE,
    Permission.READ_ALERT,
]
const EDITOR_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
    (p) => !p.startsWith('WRITE_PROJECT') && p !== Permission.WRITE_PROJECT_MEMBER && p !== Permission.WRITE_INVITATION,
)

export const rolePermissions: Record<DefaultProjectRole, Permission[]> = {
    [DefaultProjectRole.ADMIN]: ALL_PERMISSIONS,
    [DefaultProjectRole.EDITOR]: EDITOR_PERMISSIONS,
    [DefaultProjectRole.VIEWER]: READ_ONLY_PERMISSIONS,
}

