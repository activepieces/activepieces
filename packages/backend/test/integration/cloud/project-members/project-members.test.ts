import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockPlatform, createMockProject, createMockUser } from '../../../helpers/mocks'
import { generateMockToken } from '../../../helpers/auth'
import { stripeHelper } from '../../../../src/app/ee/billing/billing/stripe-helper'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { faker } from '@faker-js/faker'
import { apId } from '@activepieces/shared'
import { createMockProjectMember } from '../../../helpers/mocks/project-member-mocks'
import { PrincipalType } from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

beforeEach(async () => {
    stripeHelper.getOrCreateCustomer = jest.fn().mockResolvedValue(faker.string.uuid())
    emailService.sendInvitation = jest.fn()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Project Member API', () => {
    describe('Invite member to project Endpoint', () => {
        it('Adds new invited user', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatformId = faker.string.nanoid(21)
            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatformId,
            })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatformId,
                    role: 'OWNER',
                },
            })

            const mockInviteProjectMemberRequest = {
                email: 'test@ap.com',
                role: 'VIEWER',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-members',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockInviteProjectMemberRequest,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(Object.keys(responseBody)).toHaveLength(1)
            expect(responseBody?.token).toBeDefined()

            expect(emailService.sendInvitation).toBeCalledTimes(1)

            const projectMember = await databaseConnection.getRepository('project_member').findOneBy({
                email: mockInviteProjectMemberRequest.email,
                projectId: mockProject.id,
            })

            expect(projectMember?.status).toBe('PENDING')
        })

        it('Auto activates membership if `activateMembership` is set to true', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatformId = faker.string.nanoid(21)
            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatformId,
            })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockToken = await generateMockToken({
                id: mockUser.id,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatformId,
                    role: 'OWNER',
                },
            })

            const mockInviteProjectMemberRequest = {
                email: 'test@ap.com',
                role: 'VIEWER',
                activateMembership: true,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-members',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockInviteProjectMemberRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const projectMember = await databaseConnection.getRepository('project_member').findOneBy({
                email: mockInviteProjectMemberRequest.email,
                projectId: mockProject.id,
            })

            expect(projectMember?.status).toBe('ACTIVE')
        })

        it('Skips sending invitation email if membership is ACTIVE', async () => {
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatformId = faker.string.nanoid(21)
            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatformId,
            })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockToken = await generateMockToken({
                id: mockUser.id,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatformId,
                    role: 'OWNER',
                },
            })

            const mockInviteProjectMemberRequest = {
                email: 'test@ap.com',
                role: 'VIEWER',
                activateMembership: true,
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/project-members',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockInviteProjectMemberRequest,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            expect(emailService.sendInvitation).not.toBeCalled()
        })
    })

    describe('Delete project member by external id Endpoint', () => {
        it('Removes project membership', async () => {
            const mockPlatformId = apId()
            const mockMemberUserExternalId = faker.string.uuid()

            const mockOwnerUser = createMockUser({ platformId: mockPlatformId })
            const mockMemberUser = createMockUser({ platformId: mockPlatformId, externalId: mockMemberUserExternalId })
            await databaseConnection.getRepository('user').save([mockOwnerUser, mockMemberUser])

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockOwnerUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockOwnerUser.id, platformId: mockPlatformId })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockProjectMember = createMockProjectMember({
                projectId: mockProject.id,
                email: mockMemberUser.email,
                platformId: mockPlatformId,
            })
            await databaseConnection.getRepository('project_member').save(mockProjectMember)

            const mockToken = await generateMockToken({
                id: mockOwnerUser.id,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatformId,
                    role: 'OWNER',
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: '/v1/project-members',
                query: {
                    userExternalId: mockMemberUserExternalId,
                },
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const projectMember = await databaseConnection.getRepository('project_member').findOneBy({
                platformId: mockPlatformId,
                projectId: mockProject.id,
                email: mockMemberUser.email,
            })

            expect(projectMember).toBeNull()
        })

        it('Fails if principal is not platform owner', async () => {
            const mockPlatformId = apId()
            const mockProjectId = apId()
            const mockNonOwnerUserId = apId()
            const mockExternalUserId = faker.string.uuid()

            const mockOwnerUser = createMockUser({ platformId: mockPlatformId })
            await databaseConnection.getRepository('user').save(mockOwnerUser)

            const mockPlatform = createMockPlatform({ id: mockPlatformId, ownerId: mockOwnerUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockToken = await generateMockToken({
                id: mockNonOwnerUserId,
                projectId: mockProjectId,
                platform: {
                    id: mockPlatformId,
                    role: 'MEMBER',
                },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: '/v1/project-members',
                query: {
                    userExternalId: mockExternalUserId,
                },
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
