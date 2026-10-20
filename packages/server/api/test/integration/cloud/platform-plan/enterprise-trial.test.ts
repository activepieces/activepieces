import { DefaultProjectRole, EnterpriseTrialStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { autumnConsole, autumnUtils } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'
import { platformPlanRepo } from '../../../../src/app/ee/platform/platform-plan/platform-plan.service'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const STARTED = { startedAt: '2026-10-14T09:00:00.000Z', endsAt: '2099-10-21T09:00:00.000Z' }
const ELIGIBLE: EnterpriseTrialStatus = { state: 'eligible', startedAt: null, endsAt: null, extended: false }
const ACTIVE: EnterpriseTrialStatus = { state: 'active', ...STARTED, extended: false }
const USED: EnterpriseTrialStatus = { state: 'used', startedAt: null, endsAt: null, extended: false }

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

function stubBilling({ started }: { started: typeof STARTED | null }) {
    vi.spyOn(autumnUtils, 'ensureEnrolled').mockResolvedValue(undefined)
    vi.spyOn(autumnConsole, 'getCreds').mockResolvedValue({ autumnCustomerId: 'cus_trial', autumnApiKey: 'am_sk_trial' })
    const startTrial = vi.spyOn(autumnConsole, 'startEnterpriseTrial').mockResolvedValue(started)
    vi.spyOn(autumnUtils, 'refreshEntitlements').mockImplementation(async (_log, platformId) => {
        if (started !== null && startTrial.mock.calls.length > 0) {
            await platformPlanRepo().update({ platformId }, { enterpriseTrialStartedAt: started.startedAt, enterpriseTrialEndsAt: started.endsAt })
        }
    })
    return { startTrial }
}

describe('Enterprise trial API', () => {
    it('refuses platform members on both routes', async () => {
        const ctx = await createTestContext(app!)
        const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const { startTrial } = stubBilling({ started: STARTED })

        const status = await member.get('/v1/platform-billing/enterprise-trial')
        const start = await member.post('/v1/platform-billing/enterprise-trial/start')

        expect(status.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(start.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(startTrial).not.toHaveBeenCalled()
    })

    it('reads a platform that never had a trial as eligible, without asking the console', async () => {
        const ctx = await createTestContext(app!)
        const { startTrial } = stubBilling({ started: STARTED })

        const response = await ctx.get('/v1/platform-billing/enterprise-trial')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual(ELIGIBLE)
        expect(startTrial).not.toHaveBeenCalled()
    })

    it('starts the trial once, and a second start returns the running trial', async () => {
        const ctx = await createTestContext(app!)
        const { startTrial } = stubBilling({ started: STARTED })

        const first = await ctx.post('/v1/platform-billing/enterprise-trial/start')
        const second = await ctx.post('/v1/platform-billing/enterprise-trial/start')
        const status = await ctx.get('/v1/platform-billing/enterprise-trial')

        expect(first.json()).toEqual(ACTIVE)
        expect(second.json()).toEqual(ACTIVE)
        expect(status.json()).toEqual(ACTIVE)
        expect(startTrial).toHaveBeenCalledTimes(1)
        expect(startTrial).toHaveBeenCalledWith({ autumnCustomerId: 'cus_trial', autumnApiKey: 'am_sk_trial' })
    })

    it('keeps a started trial when the refresh after it fails', async () => {
        const ctx = await createTestContext(app!)
        vi.spyOn(autumnUtils, 'ensureEnrolled').mockResolvedValue(undefined)
        vi.spyOn(autumnConsole, 'getCreds').mockResolvedValue({ autumnCustomerId: 'cus_trial', autumnApiKey: 'am_sk_trial' })
        const startTrial = vi.spyOn(autumnConsole, 'startEnterpriseTrial').mockResolvedValue(STARTED)
        vi.spyOn(autumnUtils, 'refreshEntitlements').mockRejectedValue(new Error('autumn timeout'))

        const start = await ctx.post('/v1/platform-billing/enterprise-trial/start')
        const status = await ctx.get('/v1/platform-billing/enterprise-trial')
        const again = await ctx.post('/v1/platform-billing/enterprise-trial/start')

        expect(start.json()).toEqual(ACTIVE)
        expect(status.json()).toEqual(ACTIVE)
        expect(again.json()).toEqual(ACTIVE)
        expect(startTrial).toHaveBeenCalledTimes(1)
    })

    it('remembers a start the console refuses and stops offering the trial', async () => {
        const ctx = await createTestContext(app!)
        const { startTrial } = stubBilling({ started: null })

        const first = await ctx.post('/v1/platform-billing/enterprise-trial/start')
        const status = await ctx.get('/v1/platform-billing/enterprise-trial')
        const second = await ctx.post('/v1/platform-billing/enterprise-trial/start')

        expect(first.json()).toEqual(USED)
        expect(status.json()).toEqual(USED)
        expect(second.json()).toEqual(USED)
        expect(startTrial).toHaveBeenCalledTimes(1)
    })
})
