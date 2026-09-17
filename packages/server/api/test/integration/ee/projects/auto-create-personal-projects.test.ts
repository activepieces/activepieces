import { apId, RoleType } from '@activepieces/core-utils'
import { PlatformRole, PrincipalType, ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { authenticationUtils } from '../../../../src/app/authentication/authentication-utils'
import { userService } from '../../../../src/app/user/user-service'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockPlatform,
    createMockProject,
    createMockProjectMember,
    createMockProjectRole,
    createMockUser,
    createMockUserIdentity,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Auto-create personal projects toggle', () => {
    it('creates a personal project when autoCreatePersonalProjects is true (default)', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup({
            platform: { autoCreatePersonalProjects: true },
        })

        const identity = createMockUserIdentity({ verified: true })
        await databaseConnection().getRepository('user_identity').save(identity)

        const projectsBefore = await databaseConnection().getRepository('project').count({ where: { platformId: mockPlatform.id, type: ProjectType.PERSONAL } })

        await userService(mockLog).getOrCreateWithProject({
            identity,
            platformId: mockPlatform.id,
        })

        const projectsAfter = await databaseConnection().getRepository('project').count({ where: { platformId: mockPlatform.id, type: ProjectType.PERSONAL } })
        expect(projectsAfter).toBe(projectsBefore + 1)
    })

    it('skips personal project creation when autoCreatePersonalProjects is false', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup({
            platform: { autoCreatePersonalProjects: false },
        })

        const identity = createMockUserIdentity({ verified: true })
        await databaseConnection().getRepository('user_identity').save(identity)

        const projectsBefore = await databaseConnection().getRepository('project').count({ where: { platformId: mockPlatform.id, type: ProjectType.PERSONAL } })

        const user = await userService(mockLog).getOrCreateWithProject({
            identity,
            platformId: mockPlatform.id,
        })

        const projectsAfter = await databaseConnection().getRepository('project').count({ where: { platformId: mockPlatform.id, type: ProjectType.PERSONAL } })
        expect(projectsAfter).toBe(projectsBefore)

        const userRow = await databaseConnection().getRepository('user').findOneBy({ id: user.id })
        expect(userRow).not.toBeNull()
    })

    it('lands a member on a team project when they have no personal project', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup({
            platform: { autoCreatePersonalProjects: false },
        })

        const identity = createMockUserIdentity({ verified: true })
        await databaseConnection().getRepository('user_identity').save(identity)

        const member = createMockUser({
            identityId: identity.id,
            platformId: mockPlatform.id,
            platformRole: PlatformRole.MEMBER,
        })
        await databaseConnection().getRepository('user').save(member)

        const teamProject = createMockProject({
            ownerId: mockPlatform.ownerId,
            platformId: mockPlatform.id,
            type: ProjectType.TEAM,
        })
        await databaseConnection().getRepository('project').save(teamProject)

        const projectRole = createMockProjectRole({
            platformId: mockPlatform.id,
            type: RoleType.DEFAULT,
        })
        await databaseConnection().getRepository('project_role').save(projectRole)

        const projectMember = createMockProjectMember({
            userId: member.id,
            projectId: teamProject.id,
            platformId: mockPlatform.id,
            projectRoleId: projectRole.id,
        })
        await databaseConnection().getRepository('project_member').save(projectMember)

        const response = await authenticationUtils(mockLog).getProjectAndToken({
            userId: member.id,
            platformId: mockPlatform.id,
            projectId: null,
        })

        expect(response.projectId).toBe(teamProject.id)
        expect(response.token).toBeDefined()
    })

    it('returns projectId: null when the user has zero projects', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup({
            platform: { autoCreatePersonalProjects: false },
        })

        const identity = createMockUserIdentity({ verified: true })
        await databaseConnection().getRepository('user_identity').save(identity)

        const orphanUser = createMockUser({
            identityId: identity.id,
            platformId: mockPlatform.id,
            platformRole: PlatformRole.MEMBER,
        })
        await databaseConnection().getRepository('user').save(orphanUser)

        const response = await authenticationUtils(mockLog).getProjectAndToken({
            userId: orphanUser.id,
            platformId: mockPlatform.id,
            projectId: null,
        })

        expect(response.projectId).toBeNull()
        expect(response.token).toBeDefined()
    })

    it('allows a platform admin to DELETE a PERSONAL project while its owner is alive', async () => {
        const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup()

        const personalProject = createMockProject({
            ownerId: mockOwner.id,
            platformId: mockPlatform.id,
            type: ProjectType.PERSONAL,
        })
        await databaseConnection().getRepository('project').save(personalProject)

        const adminToken = await generateMockToken({
            id: mockOwner.id,
            type: PrincipalType.USER,
            platform: { id: mockPlatform.id },
        })

        const response = await app?.inject({
            method: 'DELETE',
            url: `/api/v1/projects/${personalProject.id}`,
            headers: { authorization: `Bearer ${adminToken}` },
        })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)

        const ownerRow = await databaseConnection().getRepository('user').findOneBy({ id: mockOwner.id })
        expect(ownerRow).not.toBeNull()
    })

    it('user delete still tears down the personal project', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup()

        const memberIdentity = createMockUserIdentity({ verified: true })
        await databaseConnection().getRepository('user_identity').save(memberIdentity)

        const member = createMockUser({
            identityId: memberIdentity.id,
            platformId: mockPlatform.id,
            platformRole: PlatformRole.MEMBER,
        })
        await databaseConnection().getRepository('user').save(member)

        const personalProject = createMockProject({
            id: apId(),
            ownerId: member.id,
            platformId: mockPlatform.id,
            type: ProjectType.PERSONAL,
        })
        await databaseConnection().getRepository('project').save(personalProject)

        await userService(mockLog).delete({
            id: member.id,
            platformId: mockPlatform.id,
        })

        const memberAfter = await databaseConnection().getRepository('user').findOneBy({ id: member.id })
        expect(memberAfter).toBeNull()

        const projectAfter = await databaseConnection().getRepository('project').findOne({ where: { id: personalProject.id }, withDeleted: true })
        expect(projectAfter).toBeDefined()
        expect(projectAfter?.deleted).not.toBeNull()
    })
})
