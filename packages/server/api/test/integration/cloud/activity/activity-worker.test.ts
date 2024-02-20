import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { PrincipalType, apId } from '@activepieces/shared'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockUser, createMockPlatform, createMockProject } from '../../../helpers/mocks'

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
                url: '/v1/worker/activity',
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
                url: '/v1/worker/activity',
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
                url: '/v1/worker/activity',
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
})
