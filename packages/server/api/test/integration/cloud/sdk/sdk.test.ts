import { apId } from '@activepieces/core-utils'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockApiKey, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const saveApiKeyForPlatform = async (platformId: string): Promise<string> => {
    const apiKey = createMockApiKey({ platformId })
    await databaseConnection().getRepository('api_key').save(apiKey)
    return apiKey.value
}

describe('Headless SDK API', () => {
    describe('POST /v1/sdk/projects', () => {
        it('creates-or-gets a project by external id (idempotent)', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({ plan: { headlessSdkEnabled: true } })
            const apiKey = await saveApiKeyForPlatform(mockPlatform.id)
            const externalId = apId()

            const first = await app?.inject({
                method: 'POST',
                url: '/api/v1/sdk/projects',
                body: { externalId },
                headers: { authorization: `Bearer ${apiKey}` },
            })
            expect(first?.statusCode).toBe(StatusCodes.OK)
            const firstBody = first?.json()
            expect(firstBody.externalId).toBe(externalId)
            expect(firstBody.platformId).toBe(mockPlatform.id)

            const second = await app?.inject({
                method: 'POST',
                url: '/api/v1/sdk/projects',
                body: { externalId },
                headers: { authorization: `Bearer ${apiKey}` },
            })
            expect(second?.statusCode).toBe(StatusCodes.OK)
            expect(second?.json().id).toBe(firstBody.id)
        })

        it('returns 402 when headlessSdkEnabled is off', async () => {
            const { mockPlatform } = await mockAndSaveBasicSetup({ plan: { headlessSdkEnabled: false } })
            const apiKey = await saveApiKeyForPlatform(mockPlatform.id)

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/sdk/projects',
                body: { externalId: apId() },
                headers: { authorization: `Bearer ${apiKey}` },
            })
            expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        })
    })

    describe('POST /v1/sdk/connect/links', () => {
        it('issues a ConnectLink redirect url for the project', async () => {
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({ plan: { headlessSdkEnabled: true } })
            const apiKey = await saveApiKeyForPlatform(mockPlatform.id)

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/sdk/connect/links',
                body: {
                    projectId: mockProject.id,
                    pieceName: '@activepieces/piece-gmail',
                    externalId: 'gmail_personal',
                },
                headers: { authorization: `Bearer ${apiKey}` },
            })
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.externalId).toBe('gmail_personal')
            expect(body.redirectUrl).toContain('/connect?token=')
        })
    })

    describe('POST /v1/connect/exchange', () => {
        it('round-trips a connect token back to its context', async () => {
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({
                plan: { headlessSdkEnabled: true },
                platform: { cloudAuthEnabled: false },
            })
            const apiKey = await saveApiKeyForPlatform(mockPlatform.id)

            const linkResponse = await app?.inject({
                method: 'POST',
                url: '/api/v1/sdk/connect/links',
                body: {
                    projectId: mockProject.id,
                    pieceName: '@activepieces/piece-gmail',
                    externalId: 'gmail_personal',
                    displayName: 'Gmail (work)',
                },
                headers: { authorization: `Bearer ${apiKey}` },
            })
            const redirectUrl: string = linkResponse!.json().redirectUrl
            const token = new URL(redirectUrl).searchParams.get('token')

            const exchange = await app?.inject({
                method: 'POST',
                url: '/api/v1/connect/exchange',
                body: { token },
            })
            expect(exchange?.statusCode).toBe(StatusCodes.OK)
            const exchanged = exchange?.json()
            expect(exchanged.projectId).toBe(mockProject.id)
            expect(exchanged.platformId).toBe(mockPlatform.id)
            expect(exchanged.pieceName).toBe('@activepieces/piece-gmail')
            expect(exchanged.externalId).toBe('gmail_personal')
            expect(exchanged.displayName).toBe('Gmail (work)')
        })

        it('returns a null displayName when none was provided', async () => {
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({
                plan: { headlessSdkEnabled: true },
                platform: { cloudAuthEnabled: false },
            })
            const apiKey = await saveApiKeyForPlatform(mockPlatform.id)

            const linkResponse = await app?.inject({
                method: 'POST',
                url: '/api/v1/sdk/connect/links',
                body: {
                    projectId: mockProject.id,
                    pieceName: '@activepieces/piece-gmail',
                    externalId: 'gmail_personal',
                },
                headers: { authorization: `Bearer ${apiKey}` },
            })
            const redirectUrl: string = linkResponse!.json().redirectUrl
            const token = new URL(redirectUrl).searchParams.get('token')

            const exchange = await app?.inject({
                method: 'POST',
                url: '/api/v1/connect/exchange',
                body: { token },
            })
            expect(exchange?.statusCode).toBe(StatusCodes.OK)
            expect(exchange?.json().displayName).toBeNull()
        })
    })
})
