import { safeHttp } from '@activepieces/server-utils'
import { OtpType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

process.env.AP_TURNSTILE_SITE_KEY = 'test-site-key'
process.env.AP_TURNSTILE_SECRET_KEY = 'test-secret-key'

const SITE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

let app: FastifyInstance | null = null
let callers = 0

function answerSiteVerify(success: boolean) {
    return vi.spyOn(safeHttp.axios, 'post').mockResolvedValue({ data: { success } })
}

async function requestCode({ email, captchaToken }: RequestCodeParams) {
    callers += 1
    return app?.inject({
        method: 'POST',
        url: '/api/v1/authentication/otp/request',
        headers: { 'x-real-ip': `10.9.${Math.floor(callers / 256)}.${callers % 256}` },
        body: {
            email,
            ...(captchaToken === undefined ? {} : { captchaToken }),
        },
    })
}

async function storedIdentity(email: string) {
    return databaseConnection().getRepository('user_identity').findOneBy({ email })
}

async function storedOtpRow(email: string) {
    const identity = await storedIdentity(email)
    if (identity === null) {
        return null
    }
    return databaseConnection().getRepository('otp').findOneBy({
        identityId: identity.id,
        type: OtpType.EMAIL_LOGIN,
    })
}

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('the captcha in front of the emailed-code request endpoint', () => {
    it('refuses a request carrying no captcha token, without asking cloudflare', async () => {
        const email = 'no-token@example.com'
        const siteVerify = answerSiteVerify(true)

        const response = await requestCode({ email })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(siteVerify).not.toHaveBeenCalled()
        expect(await storedIdentity(email)).toBeNull()
        siteVerify.mockRestore()
    })

    it('refuses a request whose token cloudflare rejects, and issues no code', async () => {
        const email = 'rejected-token@example.com'
        const siteVerify = answerSiteVerify(false)

        const response = await requestCode({ email, captchaToken: 'a-token-cloudflare-dislikes' })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(siteVerify).toHaveBeenCalledTimes(1)
        expect(await storedIdentity(email)).toBeNull()
        siteVerify.mockRestore()
    })

    it('sends the configured secret and the submitted token to cloudflare', async () => {
        const email = 'forwards-token@example.com'
        const siteVerify = answerSiteVerify(true)

        await requestCode({ email, captchaToken: 'a-token-worth-checking' })

        const [url, body] = siteVerify.mock.calls[0]
        expect(url).toBe(SITE_VERIFY_URL)
        expect(body).toContain('secret=test-secret-key')
        expect(body).toContain('response=a-token-worth-checking')
        siteVerify.mockRestore()
    })

    it('issues a code once cloudflare accepts the token', async () => {
        const email = 'accepted-token@example.com'
        const siteVerify = answerSiteVerify(true)

        const response = await requestCode({ email, captchaToken: 'a-token-cloudflare-likes' })

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        expect(siteVerify).toHaveBeenCalledTimes(1)
        expect(await storedOtpRow(email)).not.toBeNull()
        siteVerify.mockRestore()
    })
})

type RequestCodeParams = {
    email: string
    captchaToken?: string
}
