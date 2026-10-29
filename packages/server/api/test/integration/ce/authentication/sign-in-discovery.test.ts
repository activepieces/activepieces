import { FastifyBaseLogger } from 'fastify'
import { authenticationUtils } from '../../../../src/app/authentication/authentication-utils'
import { authenticationService } from '../../../../src/app/authentication/authentication.service'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let mockLog: FastifyBaseLogger

beforeAll(async () => {
    const app = await setupTestEnvironment()
    mockLog = app.log
})

afterEach(() => {
    delete process.env.AP_GOOGLE_CLIENT_ID
    delete process.env.AP_GOOGLE_CLIENT_SECRET
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Sign-in discovery', () => {
    it('returns domainOwned: false', async () => {
        await expect(authenticationService(mockLog).discoverSignInMethods({ domain: 'community.example.com' })).resolves.toEqual({ domainOwned: false })
    })

    it('reports password only on CE', () => {
        process.env.AP_GOOGLE_CLIENT_ID = 'test-google-client-id'
        process.env.AP_GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
        const methods = authenticationUtils(mockLog).getSignInMethods({
            platform: { emailAuthEnabled: false, googleAuthEnabled: true, federatedAuthProviders: { saml: {} } },
        })
        expect(methods).toEqual({ email: true, google: false, sso: false })
    })
})
