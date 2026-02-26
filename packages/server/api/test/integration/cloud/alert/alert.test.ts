import { AlertChannel, PlatformRole, PrincipalType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    mockAndSaveBasicSetup,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Alert API', () => {
    describe('Create Alert endpoint', () => {
        it('should create a new alert', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const mockReceiver = faker.internet.email()
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/alerts',
                body: {
                    projectId: mockProject.id,
                    channel: AlertChannel.EMAIL,
                    receiver: mockReceiver,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
        })

        it('should fail if alert with same receiver already exists', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const mockReceiver = faker.internet.email()
            const body = {
                projectId: mockProject.id,
                channel: AlertChannel.EMAIL,
                receiver: mockReceiver,
            }

            await app?.inject({
                method: 'POST',
                url: '/v1/alerts',
                body,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            const response = await app?.inject({
                method: 'POST',
                url: '/v1/alerts',
                body,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        })
    })

    describe('List Alerts endpoint', () => {
        it('should list alerts for a project', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const mockReceiver = faker.internet.email()
            await app?.inject({
                method: 'POST',
                url: '/v1/alerts',
                body: {
                    projectId: mockProject.id,
                    channel: AlertChannel.EMAIL,
                    receiver: mockReceiver,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/alerts',
                query: {
                    projectId: mockProject.id,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            const responseBody = response?.json()
            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].receiver).toBe(mockReceiver)
            expect(responseBody.data[0].channel).toBe(AlertChannel.EMAIL)
            expect(responseBody.data[0].projectId).toBe(mockProject.id)
        })

        it('should not return alerts from other projects', async () => {
            const { mockOwner: mockOwnerOne, mockPlatform: mockPlatformOne } = await mockAndSaveBasicSetup()
            const { mockProject: mockProjectTwo } = await mockAndSaveBasicSetup()

            const testTokenOne = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwnerOne.id,
                platform: { id: mockPlatformOne.id },
            })


            const response = await app?.inject({
                method: 'GET',
                url: '/v1/alerts',
                query: {
                    projectId: mockProjectTwo.id,
                },
                headers: {
                    authorization: `Bearer ${testTokenOne}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Delete Alert endpoint', () => {
        it('should delete an alert', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const mockReceiver = faker.internet.email()
            await app?.inject({
                method: 'POST',
                url: '/v1/alerts',
                body: {
                    projectId: mockProject.id,
                    channel: AlertChannel.EMAIL,
                    receiver: mockReceiver,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            const listResponse = await app?.inject({
                method: 'GET',
                url: '/v1/alerts',
                query: {
                    projectId: mockProject.id,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            const alertId = listResponse?.json().data[0].id

            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/v1/alerts/${alertId}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(deleteResponse?.statusCode).toBe(StatusCodes.OK)

            const listAfterDelete = await app?.inject({
                method: 'GET',
                url: '/v1/alerts',
                query: {
                    projectId: mockProject.id,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            expect(listAfterDelete?.json().data).toHaveLength(0)
        })

        it('should fail if user does not have write permission', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const ownerToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const mockReceiver = faker.internet.email()
            await app?.inject({
                method: 'POST',
                url: '/v1/alerts',
                body: {
                    projectId: mockProject.id,
                    channel: AlertChannel.EMAIL,
                    receiver: mockReceiver,
                },
                headers: {
                    authorization: `Bearer ${ownerToken}`,
                },
            })

            const listResponse = await app?.inject({
                method: 'GET',
                url: '/v1/alerts',
                query: {
                    projectId: mockProject.id,
                },
                headers: {
                    authorization: `Bearer ${ownerToken}`,
                },
            })

            const alertId = listResponse?.json().data[0].id

            const { mockUser: viewerUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const viewerToken = await generateMockToken({
                type: PrincipalType.USER,
                id: viewerUser.id,
                platform: { id: mockPlatform.id },
            })

            const deleteResponse = await app?.inject({
                method: 'DELETE',
                url: `/v1/alerts/${alertId}`,
                headers: {
                    authorization: `Bearer ${viewerToken}`,
                },
            })

            expect(deleteResponse?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })
})
