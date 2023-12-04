import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockProject, createMockUser } from '../../../helpers/mocks'
import { generateMockToken } from '../../../helpers/auth'
import { stripeHelper } from '../../../../src/app/ee/billing/billing/stripe-helper'
import { emailService } from '../../../../src/app/ee/helper/email/email-service'
import { faker } from '@faker-js/faker'

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
})
