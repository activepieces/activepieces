import { apId } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { OtpType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

process.env.AP_TURNSTILE_SITE_KEY = 'test-site-key'
process.env.AP_TURNSTILE_SECRET_KEY = 'test-secret-key'

let app: FastifyInstance | null = null
let callers = 0

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('the captcha in front of the public auth endpoints', () => {
    describe.each(protectedEndpoints())('$url', ({ url, body }) => {
        it('refuses a request carrying no captcha token, without asking cloudflare', async () => {
            const siteVerify = answerSiteVerify(false)

            const response = await post({ url, body })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
            expect(response?.body).toContain('captchaVerificationFailed')
            expect(siteVerify).not.toHaveBeenCalled()
        })

        it('refuses a request whose token cloudflare rejects', async () => {
            const siteVerify = answerSiteVerify(false)

            const response = await post({ url, body: { ...body, captchaToken: 'a-token-cloudflare-dislikes' } })

            expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
            expect(response?.body).toContain('captchaVerificationFailed')
            expect(siteVerify).toHaveBeenCalledTimes(1)
        })

        it('lets a request through once cloudflare accepts the token', async () => {
            const siteVerify = answerSiteVerify(true)

            const response = await post({ url, body: { ...body, captchaToken: 'a-token-cloudflare-likes' } })

            expect(response?.body ?? '').not.toContain('captchaVerificationFailed')
            expect(siteVerify).toHaveBeenCalledTimes(1)
        })
    })
})

function protectedEndpoints(): ProtectedEndpoint[] {
    return [
        { url: '/api/v1/otp', body: { email: 'reset@example.com', type: OtpType.PASSWORD_RESET } },
        { url: '/api/v1/authentication/sign-in', body: { email: 'sign-in@example.com', password: 'a-password' } },
        { url: '/api/v1/authentication/otp/verify', body: { email: 'code@example.com', code: '123456' } },
        { url: '/api/v1/authn/local/reset-password', body: { identityId: apId(), otp: '123456', newPassword: 'a-new-password' } },
        { url: '/api/v1/authn/saml/discover', body: { domain: 'example.com' } },
        { url: '/api/v1/user-invitations/accept', body: { invitationToken: 'an-invitation-token' } },
    ]
}

function answerSiteVerify(success: boolean) {
    return vi.spyOn(safeHttp.axios, 'post').mockResolvedValue({ data: { success } })
}

async function post({ url, body }: ProtectedEndpoint) {
    callers += 1
    return app?.inject({
        method: 'POST',
        url,
        headers: { 'x-real-ip': `10.8.${Math.floor(callers / 256)}.${callers % 256}` },
        body,
    })
}

type ProtectedEndpoint = {
    url: string
    body: Record<string, unknown>
}
