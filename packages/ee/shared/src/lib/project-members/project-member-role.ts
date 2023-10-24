
export enum ProjectMemberRole {
    ADMIN = "ADMIN",
    EDITOR = "EDITOR",
    VIEWER = "VIEWER"
}

export enum ProjectMemberPermission {
    READ_FLOW = "READ_FLOW",
    WRITE_FLOW = "WRITE_FLOW",
    READ_CONNECTION = "READ_CONNECTION",
    WRITE_CONNECTION = "WRITE_CONNECTION",
    READ_PROJECT_MEMBER = "READ_PROJECT_MEMBER",
    WRITE_PROJECT_MEMBER = "WRITE_PROJECT_MEMBER",
}

export const ProjectMemberRoleToPermissions = {
    [ProjectMemberRole.ADMIN]: [
        ProjectMemberPermission.READ_FLOW,
        ProjectMemberPermission.WRITE_FLOW,
        ProjectMemberPermission.READ_CONNECTION,
        ProjectMemberPermission.WRITE_CONNECTION,
        ProjectMemberPermission.READ_PROJECT_MEMBER,
        ProjectMemberPermission.WRITE_PROJECT_MEMBER,
    ],
    [ProjectMemberRole.EDITOR]: [
        ProjectMemberPermission.READ_FLOW,
        ProjectMemberPermission.WRITE_FLOW,
        ProjectMemberPermission.READ_CONNECTION,
        ProjectMemberPermission.WRITE_CONNECTION,
    ],
    [ProjectMemberRole.VIEWER]: [
        ProjectMemberPermission.READ_FLOW,
        ProjectMemberPermission.READ_CONNECTION,
    ],
};
