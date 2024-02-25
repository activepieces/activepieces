import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { PrincipalType, apId } from '@activepieces/shared'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockUser, createMockPlatform, createMockProject, createMockActivity } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('[Worker] Activity API', () => {
    describe('Add Activity endpoint', () => {
        it('Creates new Activity', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.WORKER,
                projectId: mockProject.id,
            })

            const mockRequestBody = {
                projectId: mockProject.id,
                event: 'test-event',
                message: 'test-message',
                status: 'test-status',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/worker/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockRequestBody,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.CREATED)

            const responseBody = response?.json()

            expect(responseBody?.id).toHaveLength(21)
            expect(responseBody?.event).toBe('test-event')
            expect(responseBody?.message).toBe('test-message')
            expect(responseBody?.status).toBe('test-status')
        })

        it('Enforces event max length', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.WORKER,
                projectId: mockProject.id,
            })

            const mockRequestBody = {
                projectId: mockProject.id,
                event: 'e'.repeat(201),
                message: 'test-message',
                status: 'test-status',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/worker/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockRequestBody,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)

            const responseBody = response?.json()
            expect(responseBody?.message).toBe('body/event must NOT have more than 200 characters')
        })

        it('Enforces message max length', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.WORKER,
                projectId: mockProject.id,
            })

            const mockRequestBody = {
                projectId: mockProject.id,
                event: 'test-event',
                message: 'm'.repeat(2001),
                status: 'test-status',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/worker/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockRequestBody,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)

            const responseBody = response?.json()
            expect(responseBody?.message).toBe('body/message must NOT have more than 2000 characters')
        })

        it('Enforces status max length', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.WORKER,
                projectId: mockProject.id,
            })

            const mockRequestBody = {
                projectId: mockProject.id,
                event: 'test-event',
                message: 'test-message',
                status: 's'.repeat(101),
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/worker/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockRequestBody,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)

            const responseBody = response?.json()
            expect(responseBody?.message).toBe('body/status must NOT have more than 100 characters')
        })

        it('Forbids access to projects other than principal\'s', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.WORKER,
                projectId: mockProject.id,
            })

            const mockRequestBody = {
                projectId: apId(),
                event: 'test-event',
                message: 'test-message',
                status: 'test-status',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/worker/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockRequestBody,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.params?.message).toBe('invalid project id')
        })

        it('Forbids access to principal types other than WORKER', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.USER,
                projectId: mockProject.id,
            })

            const mockRequestBody = {
                projectId: mockProject.id,
                event: 'test-event',
                message: 'test-message',
                status: 'test-status',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/worker/activities',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockRequestBody,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)

            const responseBody = response?.json()
            expect(responseBody?.params?.message).toBe('invalid route for principal type')
        })
    })

    describe('Update Activity endpoint', () => {
        it('Edits existing Activity', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockActivity = createMockActivity({ projectId: mockProject.id })
            await databaseConnection.getRepository('activity').save(mockActivity)

            const mockToken = await generateMockToken({
                id: apId(),
                type: PrincipalType.WORKER,
                projectId: mockProject.id,
            })

            const mockRequestBody = {
                projectId: mockProject.id,
                event: 'updated-event',
                message: 'updated-message',
                status: 'updated-status',
            }

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/worker/activities/${mockActivity.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
                body: mockRequestBody,
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)

            const updatedMockActivity = await databaseConnection.getRepository('activity').findOneBy({
                id: mockActivity.id,
            })

            expect(updatedMockActivity?.event).toBe('updated-event')
            expect(updatedMockActivity?.message).toBe('updated-message')
            expect(updatedMockActivity?.status).toBe('updated-status')
        })
    })
})
