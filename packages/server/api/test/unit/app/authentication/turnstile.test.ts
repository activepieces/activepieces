import { safeHttp } from '@activepieces/server-utils'
import { AxiosError, AxiosHeaders } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { turnstile } from '../../../../src/app/authentication/lib/turnstile'

function siteVerifyStatus(status: number): AxiosError {
    return new AxiosError('siteverify failed', 'ERR_BAD_REQUEST', undefined, undefined, {
        status,
        statusText: 'Bad Request',
        data: {},
        headers: {},
        config: { headers: new AxiosHeaders() },
    })
}

const log = { warn: vi.fn(), info: vi.fn(), error: vi.fn() } as unknown as FastifyBaseLogger

function configure({ site, secret }: { site?: string, secret?: string }): void {
    if (site === undefined) {
        delete process.env.AP_TURNSTILE_SITE_KEY
    }
    else {
        process.env.AP_TURNSTILE_SITE_KEY = site
    }
    if (secret === undefined) {
        delete process.env.AP_TURNSTILE_SECRET_KEY
    }
    else {
        process.env.AP_TURNSTILE_SECRET_KEY = secret
    }
}

beforeEach(() => {
    vi.restoreAllMocks()
    configure({})
})

afterAll(() => {
    configure({})
})

describe('turnstile', () => {
    describe('isConfigured', () => {
        it('is off when neither key is set', () => {
            expect(turnstile.isConfigured()).toBe(false)
        })

        it('stays off when only one key is set, so a half-configured instance serves no challenge', () => {
            configure({ site: 'site-key' })
            expect(turnstile.isConfigured()).toBe(false)
            expect(turnstile.siteKey()).toBeUndefined()

            configure({ secret: 'secret-key' })
            expect(turnstile.isConfigured()).toBe(false)
            expect(turnstile.siteKey()).toBeUndefined()
        })

        it('treats a blank value as unset, so an empty env line cannot lock sign-up', () => {
            configure({ site: '   ', secret: 'secret-key' })

            expect(turnstile.isConfigured()).toBe(false)
            expect(turnstile.siteKey()).toBeUndefined()
        })

        it('is on only when both keys carry a value', () => {
            configure({ site: 'site-key', secret: 'secret-key' })

            expect(turnstile.isConfigured()).toBe(true)
            expect(turnstile.siteKey()).toBe('site-key')
        })
    })

    describe('assertSolved', () => {
        it('asks nothing of the visitor when no challenge is configured', async () => {
            const post = vi.spyOn(safeHttp.axios, 'post')

            await turnstile.assertSolved({ token: undefined, remoteIp: undefined, log })

            expect(post).not.toHaveBeenCalled()
        })

        it('refuses a missing token once configured', async () => {
            configure({ site: 'site-key', secret: 'secret-key' })

            await expect(turnstile.assertSolved({ token: undefined, remoteIp: undefined, log }))
                .rejects.toThrow()
        })

        it('refuses a token cloudflare rejects', async () => {
            configure({ site: 'site-key', secret: 'secret-key' })
            vi.spyOn(safeHttp.axios, 'post').mockResolvedValue({
                data: { success: false, 'error-codes': ['invalid-input-response'] },
            })

            await expect(turnstile.assertSolved({ token: 'spent', remoteIp: '1.2.3.4', log }))
                .rejects.toThrow()
        })

        it('accepts a token cloudflare confirms', async () => {
            configure({ site: 'site-key', secret: 'secret-key' })
            vi.spyOn(safeHttp.axios, 'post').mockResolvedValue({ data: { success: true } })

            await expect(turnstile.assertSolved({ token: 'good', remoteIp: '1.2.3.4', log }))
                .resolves.toBeUndefined()
        })

        it('lets the request through when cloudflare is unreachable, rather than taking sign-in down', async () => {
            configure({ site: 'site-key', secret: 'secret-key' })
            vi.spyOn(safeHttp.axios, 'post').mockRejectedValue(new Error('ETIMEDOUT'))

            await expect(turnstile.assertSolved({ token: 'good', remoteIp: undefined, log }))
                .resolves.toBeUndefined()
        })

        it('refuses when siteverify answers with an error status, which is an answer rather than an outage', async () => {
            configure({ site: 'site-key', secret: 'secret-key' })
            vi.spyOn(safeHttp.axios, 'post').mockRejectedValue(siteVerifyStatus(400))

            await expect(turnstile.assertSolved({ token: 'good', remoteIp: undefined, log }))
                .rejects.toThrow()
        })
    })
})
