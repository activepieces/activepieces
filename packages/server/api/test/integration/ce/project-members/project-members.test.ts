import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    DefaultProjectRole,
    PlatformRole,
    PrincipalType,
    ProjectRole,
    UpdateProjectMemberRoleRequestBody,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    createMockProjectMember,
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Project Member API (CE)', () => {
    describe('Update project member role', () => {
        it('should update a project member role', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const { mockUser: mockMember } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', {
                name: DefaultProjectRole.VIEWER,
            })

            const mockProjectMember = createMockProjectMember({
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: viewerRole.id,
                userId: mockMember.id,
            })
            await db.save('project_member', mockProjectMember)

            const ownerToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const request: UpdateProjectMemberRoleRequestBody = {
                role: DefaultProjectRole.ADMIN,
            }

            const response = await app?.inject({
                method: 'POST',
                url: `/api/v1/project-members/${mockProjectMember.id}`,
                body: request,
                headers: { authorization: `Bearer ${ownerToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('List project members', () => {
        it('should return project members', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const { mockUser: mockMember } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const viewerRole = await db.findOneByOrFail<ProjectRole>('project_role', {
                name: DefaultProjectRole.VIEWER,
            })

            const mockProjectMember = createMockProjectMember({
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: viewerRole.id,
                userId: mockMember.id,
            })
            await db.save('project_member', mockProjectMember)

            const ownerToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const response = await app?.inject({
                method: 'GET',
                url: `/api/v1/project-members?projectId=${mockProject.id}`,
                headers: { authorization: `Bearer ${ownerToken}` },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockProjectMember.id)
        })
    })
})
