import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { system } from '../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../src/app/helper/system/system-props'
import { UserIdentityProvider } from '@activepieces/shared'
import { createMockPlatform, createMockPlatformPlan, createMockUser, createMockUserIdentity } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

vi.mock('../../../../src/app/ee/authentication/saml-authn/saml-client', () => ({
    createSamlClient: async () => ({
        getLoginUrl: () => 'https://idp.example.com/sso',
        parseAndValidateLoginResponse: async () => ({
            email: SSO_EMAIL,
            firstName: 'Sso',
            lastName: 'User',
        }),
    }),
    invalidateSamlClientCache: () => undefined,
}))

const PREFIXED_FRONTEND_URL = 'https://apps.customer.example.com/automation'
const SSO_EMAIL = 'sso-user@customer.example.com'

let app: FastifyInstance

async function createSamlPlatform(): Promise<string> {
    const mockUserIdentity = createMockUserIdentity({ verified: true })
    await databaseConnection().getRepository('user_identity').save(mockUserIdentity)

    const mockOwner = createMockUser({ identityId: mockUserIdentity.id, platformRole: 'ADMIN' })
    await databaseConnection().getRepository('user').save(mockOwner)

    const mockPlatform = createMockPlatform({
        ownerId: mockOwner.id,
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
        createMockPlatformPlan({ platformId: mockPlatform.id, ssoEnabled: true }),
    )

    const ssoIdentity = createMockUserIdentity({
        email: SSO_EMAIL,
        verified: true,
        provider: UserIdentityProvider.SAML,
    })
    await databaseConnection().getRepository('user_identity').save(ssoIdentity)
    await databaseConnection().getRepository('user').save(createMockUser({
        identityId: ssoIdentity.id,
        platformId: mockPlatform.id,
        platformRole: 'MEMBER',
    }))

    return mockPlatform.id
}

describe('SAML ACS redirect', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
        const realGetOrThrow = system.getOrThrow.bind(system)
        vi.spyOn(system, 'getOrThrow').mockImplementation((prop) => prop === AppSystemProp.FRONTEND_URL ? PREFIXED_FRONTEND_URL : realGetOrThrow(prop))
    })

    afterAll(async () => {
        vi.restoreAllMocks()
        await teardownTestEnvironment()
    })

    it('returns the browser to /authenticate under the configured path prefix', async () => {
        const platformId = await createSamlPlatform()

        const response = await app.inject({
            method: 'POST',
            url: `/api/v1/authn/saml/acs?platformId=${platformId}`,
            headers: {
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'apps.customer.example.com',
                'content-type': 'application/x-www-form-urlencoded',
            },
            payload: 'SAMLResponse=stubbed',
        })

        expect(response.statusCode).toBe(302)
        const location = new URL(response.headers.location as string)
        expect(location.origin).toBe('https://apps.customer.example.com')
        expect(location.pathname).toBe('/automation/authenticate')
        expect(location.searchParams.get('response')).toBeTruthy()
    })
})
