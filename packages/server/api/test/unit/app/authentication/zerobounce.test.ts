import { safeHttp } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { zerobounce } from '../../../../src/app/authentication/lib/zerobounce'

const mockStoreGet = vi.fn()
const mockStorePut = vi.fn()
const mockHasAcceptedInvitation = vi.fn()

vi.mock('../../../../src/app/database/redis-connections', () => ({
    distributedStore: {
        get: (...args: unknown[]) => mockStoreGet(...args),
        put: (...args: unknown[]) => mockStorePut(...args),
    },
}))

vi.mock('../../../../src/app/user-invitations/user-invitation.service', () => ({
    userInvitationsService: () => ({
        hasAnyAcceptedInvitationsForEmail: (...args: unknown[]) => mockHasAcceptedInvitation(...args),
    }),
}))

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

async function maySignUp(email = 'someone@example.com'): Promise<boolean> {
    return zerobounce.maySignUp({ email, log })
}

beforeEach(() => {
    vi.restoreAllMocks()
    mockStoreGet.mockReset().mockResolvedValue(null)
    mockStorePut.mockReset().mockResolvedValue(undefined)
    mockHasAcceptedInvitation.mockReset().mockResolvedValue(false)
    configure('api-key')
})

afterAll(() => {
    configure()
})

describe('zerobounce', () => {
    describe('maySignUp', () => {
        it('asks nothing and refuses nothing when no api key is set, so a self-hosted instance needs no account', async () => {
            configure()
            const get = vi.spyOn(safeHttp.axios, 'get')

            expect(await maySignUp('someone@mailinator.com')).toBe(true)
            expect(get).not.toHaveBeenCalled()
            expect(mockStoreGet).not.toHaveBeenCalled()
        })

        it('treats a blank api key as unset, so an empty env line cannot spend credits', async () => {
            configure('   ')
            const get = vi.spyOn(safeHttp.axios, 'get')

            await maySignUp('someone@mailinator.com')

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
            answers(verdict)
            expect(await maySignUp()).toBe(false)
        })

        it.each([
            { status: 'valid', sub_status: '' },
            { status: 'catch-all', sub_status: '' },
            { status: 'unknown', sub_status: 'greylisted' },
            { status: 'invalid', sub_status: 'mailbox_not_found' },
            { status: 'invalid', sub_status: 'possible_typo' },
            { status: 'do_not_mail', sub_status: 'role_based' },
            { status: 'do_not_mail', sub_status: 'role_based_catch_all' },
            { status: 'do_not_mail', sub_status: 'mx_forward' },
        ])('lets $status/$sub_status through', async (verdict) => {
            answers(verdict)
            expect(await maySignUp()).toBe(true)
        })

        it('matches the verdict regardless of the case zerobounce answers in', async () => {
            answers({ status: 'DO_NOT_MAIL', sub_status: 'Disposable' })
            expect(await maySignUp()).toBe(false)
        })

        it('lets a refused address through when it holds an accepted invitation', async () => {
            answers({ status: 'do_not_mail', sub_status: 'disposable' })
            mockHasAcceptedInvitation.mockResolvedValue(true)

            expect(await maySignUp('guest@mailinator.com')).toBe(true)
        })

        it('lets the address through when zerobounce is unreachable, rather than taking sign-up down', async () => {
            vi.spyOn(safeHttp.axios, 'get').mockRejectedValue(new Error('ETIMEDOUT'))

            expect(await maySignUp('someone@mailinator.com')).toBe(true)
        })

        it('lets the address through when the key is rejected or the credits are gone, which answers 200 with an error body', async () => {
            answers({ status: '', error: 'Invalid API Key or your account ran out of credits' })

            expect(await maySignUp('someone@mailinator.com')).toBe(true)
        })

        it('lets the address through when the answer carries no verdict at all', async () => {
            vi.spyOn(safeHttp.axios, 'get').mockResolvedValue({ data: {} })

            expect(await maySignUp('someone@mailinator.com')).toBe(true)
        })
    })

    describe('disposable-domain cache', () => {
        it('appends a disposable domain to the list under a versioned key', async () => {
            answers({ status: 'do_not_mail', sub_status: 'disposable' })
            mockStoreGet.mockResolvedValue(['already-known.com'])

            await maySignUp('first@mailinator.com')

            expect(mockStorePut).toHaveBeenCalledWith(
                'zerobounce:disposable-domains:v1',
                ['already-known.com', 'mailinator.com'],
            )
        })

        it('drops the oldest entry once the list is full, keeping it at 500', async () => {
            const full = Array.from({ length: 500 }, (_unused, index) => `domain-${index}.com`)
            answers({ status: 'do_not_mail', sub_status: 'disposable' })
            mockStoreGet.mockResolvedValue(full)

            await maySignUp('first@mailinator.com')

            const stored = mockStorePut.mock.calls[0][1] as string[]
            expect(stored).toHaveLength(500)
            expect(stored).not.toContain('domain-0.com')
            expect(stored[0]).toBe('domain-1.com')
            expect(stored[499]).toBe('mailinator.com')
        })

        it('does not rewrite the list for a domain it already holds', async () => {
            answers({ status: 'do_not_mail', sub_status: 'disposable' })
            mockStoreGet.mockResolvedValue(['mailinator.com'])

            expect(await maySignUp('someone@mailinator.com')).toBe(false)
            expect(mockStorePut).not.toHaveBeenCalled()
        })

        it('refuses a known disposable domain without spending a credit', async () => {
            const get = vi.spyOn(safeHttp.axios, 'get')
            mockStoreGet.mockResolvedValue(['mailinator.com'])

            expect(await maySignUp('anyone@mailinator.com')).toBe(false)
            expect(get).not.toHaveBeenCalled()
        })

        it('still honours the invitation carve-out on a cached refusal', async () => {
            mockStoreGet.mockResolvedValue(['mailinator.com'])
            mockHasAcceptedInvitation.mockResolvedValue(true)

            expect(await maySignUp('guest@mailinator.com')).toBe(true)
        })

        it('asks zerobounce when the stored value is not a list', async () => {
            mockStoreGet.mockResolvedValue('not-a-list')
            const get = answers({ status: 'valid', sub_status: '' })

            expect(await maySignUp('someone@gmail.com')).toBe(true)
            expect(get).toHaveBeenCalled()
        })

        it.each([
            { status: 'do_not_mail', sub_status: 'toxic' },
            { status: 'do_not_mail', sub_status: 'global_suppression' },
            { status: 'spamtrap', sub_status: '' },
            { status: 'abuse', sub_status: '' },
        ])('never caches the address-level verdict $status/$sub_status by domain', async (verdict) => {
            answers(verdict)

            await maySignUp('one-bad-mailbox@gmail.com')

            expect(mockStorePut).not.toHaveBeenCalled()
        })

        it('does not cache an allow verdict, so an address-level refusal is never skipped', async () => {
            answers({ status: 'valid', sub_status: '' })

            await maySignUp('someone@gmail.com')

            expect(mockStorePut).not.toHaveBeenCalled()
        })

        it('asks zerobounce when the cache read fails, rather than refusing or crashing', async () => {
            mockStoreGet.mockRejectedValue(new Error('ECONNREFUSED'))
            answers({ status: 'valid', sub_status: '' })

            expect(await maySignUp('someone@gmail.com')).toBe(true)
        })

        it('still refuses when the verdict cannot be cached', async () => {
            answers({ status: 'do_not_mail', sub_status: 'disposable' })
            mockStorePut.mockRejectedValue(new Error('ECONNREFUSED'))

            expect(await maySignUp('someone@mailinator.com')).toBe(false)
        })

        it('does not touch the cache for an address with no domain', async () => {
            answers({ status: 'valid', sub_status: '' })

            await maySignUp('not-an-email')

            expect(mockStoreGet).not.toHaveBeenCalled()
            expect(mockStorePut).not.toHaveBeenCalled()
        })
    })
})
