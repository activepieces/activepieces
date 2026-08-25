import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { createMockPlatform, createMockPlatformPlan, createMockUser, createMockUserIdentity } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('SAML Discover API', () => {
    describe('POST /v1/authn/saml/discover', () => {
        it('should return platformId when ssoDomain matches platform with SAML configured', async () => {
            const mockUserIdentity = createMockUserIdentity({ verified: true })
            await databaseConnection().getRepository('user_identity').save(mockUserIdentity)

            const mockOwner = createMockUser({
                identityId: mockUserIdentity.id,
                platformRole: 'ADMIN',
            })
            await databaseConnection().getRepository('user').save(mockOwner)

            const mockPlatform = createMockPlatform({
                ownerId: mockOwner.id,
                ssoDomain: 'discover-test.example.com',
                ssoDomainVerification: {
                    status: 'VERIFIED',
                    record: {
                        type: 'TXT',
                        name: '_activepieces-verify.discover-test.example.com',
                        value: 'activepieces-verify=test-token',
                    },
                },
                federatedAuthProviders: {
                    saml: {
                        idpMetadata: '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"></md:EntityDescriptor>',
                        idpCertificate: 'test-cert',
                    },
                },
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            mockOwner.platformId = mockPlatform.id
            await databaseConnection().getRepository('user').save(mockOwner)

            await databaseConnection().getRepository('platform_plan').save(
                createMockPlatformPlan({
                    platformId: mockPlatform.id,
                    ssoEnabled: true,
                }),
            )

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authn/saml/discover',
                body: { domain: 'discover-test.example.com' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().platformId).toBe(mockPlatform.id)
        })

        it('should return null platformId when no platform matches the domain', async () => {
            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authn/saml/discover',
                body: { domain: 'nonexistent-domain.com' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().platformId).toBeNull()
        })

        it('should return null when ssoDomain matches but platform has no SAML config', async () => {
            const mockUserIdentity = createMockUserIdentity({ verified: true })
            await databaseConnection().getRepository('user_identity').save(mockUserIdentity)

            const mockOwner = createMockUser({
                identityId: mockUserIdentity.id,
                platformRole: 'ADMIN',
            })
            await databaseConnection().getRepository('user').save(mockOwner)

            const mockPlatform = createMockPlatform({
                ownerId: mockOwner.id,
                ssoDomain: 'no-saml.example.com',
                ssoDomainVerification: {
                    status: 'VERIFIED',
                    record: {
                        type: 'TXT',
                        name: '_activepieces-verify.no-saml.example.com',
                        value: 'activepieces-verify=test-token',
                    },
                },
                federatedAuthProviders: { saml: null },
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            mockOwner.platformId = mockPlatform.id
            await databaseConnection().getRepository('user').save(mockOwner)

            await databaseConnection().getRepository('platform_plan').save(
                createMockPlatformPlan({
                    platformId: mockPlatform.id,
                    ssoEnabled: true,
                }),
            )

            const response = await app?.inject({
                method: 'POST',
                url: '/api/v1/authn/saml/discover',
                body: { domain: 'no-saml.example.com' },
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(response?.json().platformId).toBeNull()
        })
    })
})
