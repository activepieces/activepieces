import { AlertChannel, PlatformRole, PrincipalType, ProjectType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import {
    mockBasicUser,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('Alert API', () => {
    describe('Create Alert endpoint', () => {
        it('should create a new alert', async () => {
            const ctx = await createTestContext(app!)

            const mockReceiver = faker.internet.email()
            const response = await ctx.post('/v1/alerts', {
                projectId: ctx.project.id,
                channel: AlertChannel.EMAIL,
                receiver: mockReceiver,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should fail if alert with same receiver already exists', async () => {
            const ctx = await createTestContext(app!)

            const mockReceiver = faker.internet.email()
            const body = {
                projectId: ctx.project.id,
                channel: AlertChannel.EMAIL,
                receiver: mockReceiver,
            }

            await ctx.post('/v1/alerts', body)

            const response = await ctx.post('/v1/alerts', body)

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('should fail if alert with same receiver already exists, ignoring casing', async () => {
            const ctx = await createTestContext(app!)

            const mockReceiver = faker.internet.email()

            await ctx.post('/v1/alerts', {
                projectId: ctx.project.id,
                channel: AlertChannel.EMAIL,
                receiver: mockReceiver.toLowerCase(),
            })

            const response = await ctx.post('/v1/alerts', {
                projectId: ctx.project.id,
                channel: AlertChannel.EMAIL,
                receiver: mockReceiver.toUpperCase(),
            })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        })
    })

    describe('List Alerts endpoint', () => {
        it('should list alerts for a project', async () => {
            const ctx = await createTestContext(app!)

            const mockReceiver = faker.internet.email()
            await ctx.post('/v1/alerts', {
                projectId: ctx.project.id,
                channel: AlertChannel.EMAIL,
                receiver: mockReceiver,
            })

            const response = await ctx.get('/v1/alerts', {
                projectId: ctx.project.id,
            })

            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].receiver).toBe(mockReceiver.toLowerCase())
            expect(responseBody.data[0].channel).toBe(AlertChannel.EMAIL)
            expect(responseBody.data[0].projectId).toBe(ctx.project.id)
        })

        it('should not return alerts from other projects', async () => {
            const ctxOne = await createTestContext(app!)
            const ctxTwo = await createTestContext(app!)

            const response = await app?.inject({
                method: 'GET',
                url: '/api/v1/alerts',
                query: {
                    projectId: ctxTwo.project.id,
                },
                headers: {
                    authorization: `Bearer ${ctxOne.token}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Delete Alert endpoint', () => {
        it('should delete an alert', async () => {
            const ctx = await createTestContext(app!)

            const mockReceiver = faker.internet.email()
            await ctx.post('/v1/alerts', {
                projectId: ctx.project.id,
                channel: AlertChannel.EMAIL,
                receiver: mockReceiver,
            })

            const listResponse = await ctx.get('/v1/alerts', {
                projectId: ctx.project.id,
            })

            const alertId = listResponse?.json().data[0].id

            const deleteResponse = await ctx.delete(`/v1/alerts/${alertId}`)

            expect(deleteResponse?.statusCode).toBe(StatusCodes.OK)

            const listAfterDelete = await ctx.get('/v1/alerts', {
                projectId: ctx.project.id,
            })

            expect(listAfterDelete?.json().data).toHaveLength(0)
        })

        it('should fail if user does not have write permission', async () => {
            const ctx = await createTestContext(app!)

            const mockReceiver = faker.internet.email()
            await ctx.post('/v1/alerts', {
                projectId: ctx.project.id,
                channel: AlertChannel.EMAIL,
                receiver: mockReceiver,
            })

            const listResponse = await ctx.get('/v1/alerts', {
                projectId: ctx.project.id,
            })

            const alertId = listResponse?.json().data[0].id

            const { mockUser: viewerUser } = await mockBasicUser({
                user: {
                    platformId: ctx.platform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const viewerToken = await generateMockToken({
                type: PrincipalType.USER,
                id: viewerUser.id,
                platform: { id: ctx.platform.id },
            })

            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/api/v1/alerts/${alertId}`,
                headers: {
                    authorization: `Bearer ${viewerToken}`,
                },
            })

            expect(deleteResponse?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Personal projects', () => {
        it('should accept creating an alert when receiver matches the project owner email', async () => {
            const ctx = await createTestContext(app!, {
                project: { type: ProjectType.PERSONAL },
            })

            const response = await ctx.post('/v1/alerts', {
                projectId: ctx.project.id,
                channel: AlertChannel.EMAIL,
                receiver: ctx.userIdentity.email,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should accept the owner email regardless of casing', async () => {
            const ctx = await createTestContext(app!, {
                project: { type: ProjectType.PERSONAL },
            })

            const response = await ctx.post('/v1/alerts', {
                projectId: ctx.project.id,
                channel: AlertChannel.EMAIL,
                receiver: ctx.userIdentity.email.toUpperCase(),
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should reject creating an alert when receiver is not the project owner', async () => {
            const ctx = await createTestContext(app!, {
                project: { type: ProjectType.PERSONAL },
            })

            const response = await ctx.post('/v1/alerts', {
                projectId: ctx.project.id,
                channel: AlertChannel.EMAIL,
                receiver: faker.internet.email(),
            })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        })

        it('should list alerts on a personal project', async () => {
            const ctx = await createTestContext(app!, {
                project: { type: ProjectType.PERSONAL },
            })

            const response = await ctx.get('/v1/alerts', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().data).toEqual([])
        })
    })
})
