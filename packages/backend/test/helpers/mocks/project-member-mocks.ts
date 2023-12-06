import { ProjectMember, ProjectMemberRole, ProjectMemberStatus } from '@activepieces/ee-shared'
import { apId } from '@activepieces/shared'
import { faker } from '@faker-js/faker'

export const createMockProjectMember = (projectMember?: Partial<ProjectMember>): ProjectMember => {
    return {
        id: projectMember?.id ?? apId(),
        created: projectMember?.created ?? faker.date.recent().toISOString(),
        updated: projectMember?.updated ?? faker.date.recent().toISOString(),
        platformId: projectMember?.platformId ?? null,
        email: projectMember?.email ?? faker.internet.email(),
        projectId: projectMember?.projectId ?? apId(),
        role: projectMember?.role ?? faker.helpers.enumValue(ProjectMemberRole),
        status: projectMember?.status ?? faker.helpers.enumValue(ProjectMemberStatus),
    }
}
