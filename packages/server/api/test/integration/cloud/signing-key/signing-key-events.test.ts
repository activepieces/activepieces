import { ApplicationEventName, PrincipalType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { auditLogRepo } from '../../../../src/app/ee/audit-logs/audit-event-service'
import * as applicationEventsModule from '../../../../src/app/helper/application-events'
import { actionsEmitted } from '../../../helpers/application-events'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
const originalApplicationEvents = applicationEventsModule.applicationEvents

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Signing key application events', () => {
    let sendUserEventSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
        sendUserEventSpy = vi.fn()
        vi.spyOn(applicationEventsModule, 'applicationEvents').mockImplementation((log) => {
            const real = originalApplicationEvents(log)
            return {
                ...real,
                sendUserEvent: sendUserEventSpy,
            }
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('emits SIGNING_KEY_CREATED on POST /api/v1/signing-keys', async () => {
        const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({ plan: { embeddingEnabled: true } })
        const token = await generateMockToken({
            type: PrincipalType.USER,
            id: mockOwner.id,
            platform: { id: mockPlatform.id },
        })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/signing-keys',
            body: { displayName: faker.lorem.word() },
            headers: { authorization: `Bearer ${token}` },
        })

        expect(response?.statusCode).toBe(StatusCodes.CREATED)
        expect(actionsEmitted(sendUserEventSpy)).toEqual([
            ApplicationEventName.SIGNING_KEY_CREATED,
        ])
    })

    it('keeps the private key out of the SIGNING_KEY_CREATED payload', async () => {
        const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({ plan: { embeddingEnabled: true } })
        const token = await generateMockToken({
            type: PrincipalType.USER,
            id: mockOwner.id,
            platform: { id: mockPlatform.id },
        })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/signing-keys',
            body: { displayName: faker.lorem.word() },
            headers: { authorization: `Bearer ${token}` },
        })

        expect(response?.statusCode).toBe(StatusCodes.CREATED)
        const createdKey = response.json()
        expect(createdKey.privateKey).toContain('PRIVATE KEY')
        const emittedSigningKey = sendUserEventSpy.mock.calls[0][1].data.signingKey
        expect(Object.keys(emittedSigningKey).sort()).toEqual(['created', 'displayName', 'id', 'updated'])
        expect(emittedSigningKey.id).toBe(createdKey.id)
        expect(emittedSigningKey.displayName).toBe(createdKey.displayName)
    })
})

describe('Signing key audit persistence', () => {
    it('does not store the private key in the audit log', async () => {
        const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({ plan: { embeddingEnabled: true, auditLogEnabled: true } })
        const token = await generateMockToken({
            type: PrincipalType.USER,
            id: mockOwner.id,
            platform: { id: mockPlatform.id },
        })

        const response = await app.inject({
            method: 'POST',
            url: '/api/v1/signing-keys',
            body: { displayName: faker.lorem.word() },
            headers: { authorization: `Bearer ${token}` },
        })

        expect(response?.statusCode).toBe(StatusCodes.CREATED)
        const privateKey: string = response.json().privateKey
        await vi.waitUntil(
            async () => await auditLogRepo().countBy({ platformId: mockPlatform.id, action: ApplicationEventName.SIGNING_KEY_CREATED }) > 0,
            { timeout: 5000, interval: 50 },
        )
        const savedEvent = await auditLogRepo().findOneByOrFail({ platformId: mockPlatform.id, action: ApplicationEventName.SIGNING_KEY_CREATED })
        const serializedEvent = JSON.stringify(savedEvent)
        expect(serializedEvent).not.toContain('PRIVATE KEY')
        expect(serializedEvent).not.toContain(privateKey)
    })
})

