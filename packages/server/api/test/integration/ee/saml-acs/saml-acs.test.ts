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
let platformId: string

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

async function acs({ host }: { host: string }): Promise<URL> {
    const response = await app.inject({
        method: 'POST',
        url: `/api/v1/authn/saml/acs?platformId=${platformId}`,
        headers: {
            'x-forwarded-proto': 'https',
            'x-forwarded-host': host,
            'content-type': 'application/x-www-form-urlencoded',
        },
        payload: 'SAMLResponse=stubbed',
    })

    expect(response.statusCode).toBe(302)
    return new URL(response.headers.location as string)
}

describe('SAML ACS redirect', () => {
    beforeAll(async () => {
        app = await setupTestEnvironment({ fresh: true })
        const realGetOrThrow = system.getOrThrow.bind(system)
        vi.spyOn(system, 'getOrThrow').mockImplementation((prop) => prop === AppSystemProp.FRONTEND_URL ? PREFIXED_FRONTEND_URL : realGetOrThrow(prop))
        platformId = await createSamlPlatform()
    })

    afterAll(async () => {
        vi.restoreAllMocks()
        await teardownTestEnvironment()
    })

    it('returns the browser to /authenticate at the origin root, never under the configured prefix', async () => {
        const location = await acs({ host: 'apps.customer.example.com' })

        expect(location.origin).toBe('https://apps.customer.example.com')
        expect(location.pathname).toBe('/authenticate')
        expect(location.searchParams.get('response')).toBeTruthy()
    })

    it('carries the session response so the SPA can consume it on landing', async () => {
        const location = await acs({ host: 'apps.customer.example.com' })
        const response = JSON.parse(location.searchParams.get('response') as string)

        expect(response.email).toBe(SSO_EMAIL)
        expect(response.token).toBeTruthy()
    })

    it('follows the host the assertion was posted to, so a custom domain returns to itself', async () => {
        const location = await acs({ host: 'sso.customer.example.com' })

        expect(location.origin).toBe('https://sso.customer.example.com')
        expect(location.pathname).toBe('/authenticate')
    })
})
