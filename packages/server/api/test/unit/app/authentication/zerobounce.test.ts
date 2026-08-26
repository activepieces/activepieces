import { safeHttp } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { zerobounce } from '../../../../src/app/authentication/lib/zerobounce'

const log = { warn: vi.fn(), info: vi.fn(), error: vi.fn() } as unknown as FastifyBaseLogger

function configure(apiKey?: string): void {
    if (apiKey === undefined) {
        delete process.env.AP_ZEROBOUNCE_API_KEY
    }
    else {
        process.env.AP_ZEROBOUNCE_API_KEY = apiKey
    }
}

function answers(verdict: { status: string, sub_status?: string, error?: string }) {
    return vi.spyOn(safeHttp.axios, 'get').mockResolvedValue({ data: verdict })
}

async function refuses(verdict: { status: string, sub_status?: string }): Promise<boolean> {
    answers(verdict)
    return zerobounce.isRefused({ email: 'someone@example.com', log })
}

beforeEach(() => {
    vi.restoreAllMocks()
    configure('api-key')
})

afterAll(() => {
    configure()
})

describe('zerobounce', () => {
    describe('isRefused', () => {
        it('asks nothing and refuses nothing when no api key is set, so a self-hosted instance needs no account', async () => {
            configure()
            const get = vi.spyOn(safeHttp.axios, 'get')

            const refused = await zerobounce.isRefused({ email: 'someone@mailinator.com', log })

            expect(refused).toBe(false)
            expect(get).not.toHaveBeenCalled()
        })

        it('treats a blank api key as unset, so an empty env line cannot spend credits', async () => {
            configure('   ')
            const get = vi.spyOn(safeHttp.axios, 'get')

            await zerobounce.isRefused({ email: 'someone@mailinator.com', log })

            expect(get).not.toHaveBeenCalled()
        })

        it.each([
            { status: 'do_not_mail', sub_status: 'disposable' },
            { status: 'do_not_mail', sub_status: 'toxic' },
            { status: 'do_not_mail', sub_status: 'possible_trap' },
            { status: 'do_not_mail', sub_status: 'global_suppression' },
            { status: 'spamtrap', sub_status: '' },
            { status: 'abuse', sub_status: '' },
        ])('refuses $status/$sub_status', async (verdict) => {
            expect(await refuses(verdict)).toBe(true)
        })

        it.each([
            { status: 'valid', sub_status: '' },
            { status: 'catch-all', sub_status: '' },
            { status: 'unknown', sub_status: 'greylisted' },
            { status: 'invalid', sub_status: 'mailbox_not_found' },
            { status: 'invalid', sub_status: 'possible_typo' },
        ])('lets $status/$sub_status through', async (verdict) => {
            expect(await refuses(verdict)).toBe(false)
        })

        it.each([
            { status: 'do_not_mail', sub_status: 'role_based' },
            { status: 'do_not_mail', sub_status: 'role_based_catch_all' },
            { status: 'do_not_mail', sub_status: 'mx_forward' },
        ])('lets $sub_status through, since info@ and sales@ are how teams sign up', async (verdict) => {
            expect(await refuses(verdict)).toBe(false)
        })

        it('matches the verdict regardless of the case zerobounce answers in', async () => {
            expect(await refuses({ status: 'DO_NOT_MAIL', sub_status: 'Disposable' })).toBe(true)
        })

        it('sends the address for validation and caps how long it waits', async () => {
            const get = answers({ status: 'valid' })

            await zerobounce.isRefused({ email: 'someone@example.com', log })

            expect(get).toHaveBeenCalledWith(
                'https://api.zerobounce.net/v2/validate',
                expect.objectContaining({
                    params: expect.objectContaining({ api_key: 'api-key', email: 'someone@example.com' }),
                    timeout: expect.any(Number),
                }),
            )
        })

        it('lets the address through when zerobounce is unreachable, rather than taking sign-up down', async () => {
            vi.spyOn(safeHttp.axios, 'get').mockRejectedValue(new Error('ETIMEDOUT'))

            expect(await zerobounce.isRefused({ email: 'someone@mailinator.com', log })).toBe(false)
        })

        it('lets the address through when the key is rejected or the credits are gone, which answers 200 with an error body', async () => {
            answers({ status: '', error: 'Invalid API Key or your account ran out of credits' })

            expect(await zerobounce.isRefused({ email: 'someone@mailinator.com', log })).toBe(false)
        })

        it('lets the address through when the answer carries no verdict at all', async () => {
            vi.spyOn(safeHttp.axios, 'get').mockResolvedValue({ data: {} })

            expect(await zerobounce.isRefused({ email: 'someone@mailinator.com', log })).toBe(false)
        })
    })
})
