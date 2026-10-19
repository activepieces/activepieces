import { DefaultProjectRole, EnterpriseTrialStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { autumnConsole, autumnUtils } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const ELIGIBLE: EnterpriseTrialStatus = { state: 'eligible', startedAt: null, endsAt: null, extended: false }
const ACTIVE: EnterpriseTrialStatus = { state: 'active', startedAt: '2026-10-14T09:00:00.000Z', endsAt: '2026-10-21T09:00:00.000Z', extended: false }

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

afterEach(() => {
    vi.restoreAllMocks()
})

function stubConsole({ statuses }: { statuses: EnterpriseTrialStatus[] }) {
    vi.spyOn(autumnUtils, 'ensureEnrolled').mockResolvedValue(undefined)
    vi.spyOn(autumnUtils, 'refreshEntitlements').mockResolvedValue(undefined)
    vi.spyOn(autumnConsole, 'getCreds').mockResolvedValue({ autumnCustomerId: 'cus_trial', autumnApiKey: 'am_sk_trial' })
    const getTrial = statuses.reduce(
        (spy, status) => spy.mockResolvedValueOnce(status),
        vi.spyOn(autumnConsole, 'getEnterpriseTrial'),
    )
    const startTrial = vi.spyOn(autumnConsole, 'startEnterpriseTrial').mockResolvedValue(ACTIVE)
    return { getTrial, startTrial }
}

describe('Enterprise trial API', () => {
    it('refuses platform members on both routes', async () => {
        const ctx = await createTestContext(app!)
        const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const { getTrial, startTrial } = stubConsole({ statuses: [ELIGIBLE] })

        const status = await member.get('/v1/platform-billing/enterprise-trial')
        const start = await member.post('/v1/platform-billing/enterprise-trial/start')

        expect(status.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(start.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(getTrial).not.toHaveBeenCalled()
        expect(startTrial).not.toHaveBeenCalled()
    })

    it('reads the trial from the console as Cloud', async () => {
        const ctx = await createTestContext(app!)
        const { getTrial } = stubConsole({ statuses: [ELIGIBLE] })

        const response = await ctx.get('/v1/platform-billing/enterprise-trial')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual(ELIGIBLE)
        expect(getTrial).toHaveBeenCalledWith(expect.objectContaining({
            autumnCustomerId: 'cus_trial',
            edition: 'cloud',
        }))
    })

    it('starts the trial once, and a second start returns the running trial', async () => {
        const ctx = await createTestContext(app!)
        const { startTrial } = stubConsole({ statuses: [ELIGIBLE, ACTIVE] })

        const first = await ctx.post('/v1/platform-billing/enterprise-trial/start')
        const second = await ctx.post('/v1/platform-billing/enterprise-trial/start')

        expect(first.statusCode).toBe(StatusCodes.OK)
        expect(first.json()).toEqual(ACTIVE)
        expect(second.statusCode).toBe(StatusCodes.OK)
        expect(second.json()).toEqual(ACTIVE)
        expect(startTrial).toHaveBeenCalledTimes(1)
        expect(startTrial).toHaveBeenCalledWith(expect.objectContaining({ edition: 'cloud', platformId: ctx.platform.id }))
    })
})
