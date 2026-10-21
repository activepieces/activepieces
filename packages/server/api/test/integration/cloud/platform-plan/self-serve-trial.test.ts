import { DefaultProjectRole, PlanName, SelfServeTrialStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { distributedStore } from '../../../../src/app/database/redis-connections'
import { autumnConsole, autumnUtils, SelfServeTrialStartOutcome } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'
import { platformPlanRepo } from '../../../../src/app/ee/platform/platform-plan/platform-plan.service'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const STARTED = { startedAt: '2026-10-14T09:00:00.000Z', endsAt: '2099-10-21T09:00:00.000Z' }
const ELIGIBLE: SelfServeTrialStatus = { state: 'eligible', startedAt: null, endsAt: null, extended: false }
const INELIGIBLE: SelfServeTrialStatus = { state: 'ineligible', startedAt: null, endsAt: null, extended: false }
const ACTIVE: SelfServeTrialStatus = { state: 'active', ...STARTED, extended: false }
const USED: SelfServeTrialStatus = { state: 'used', startedAt: null, endsAt: null, extended: false }

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

async function onPlan({ platformId, plan }: { platformId: string, plan: string }) {
    await platformPlanRepo().update({ platformId }, { plan })
    await distributedStore.put(`platform_plan:self-serve-trial:v1:${platformId}`, { window: null }, 60)
}

function stubBilling({ outcome }: { outcome: SelfServeTrialStartOutcome }) {
    vi.spyOn(autumnUtils, 'ensureEnrolled').mockResolvedValue(undefined)
    vi.spyOn(autumnConsole, 'getCreds').mockResolvedValue({ autumnCustomerId: 'cus_trial', autumnApiKey: 'am_sk_trial' })
    vi.spyOn(autumnUtils, 'refreshEntitlements').mockResolvedValue(undefined)
    const startTrial = vi.spyOn(autumnConsole, 'startSelfServeTrial').mockResolvedValue(outcome)
    return { startTrial }
}

describe('Self-serve trial API', () => {
    it('refuses platform members on both routes', async () => {
        const ctx = await createTestContext(app!)
        const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.EDITOR })
        const { startTrial } = stubBilling({ outcome: { result: 'started', ...STARTED } })

        const status = await member.get('/v1/platform-billing/self-serve-trial')
        const start = await member.post('/v1/platform-billing/self-serve-trial/start')

        expect(status.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(start.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(startTrial).not.toHaveBeenCalled()
    })

    it('reads a Free platform that never had a trial as eligible, without asking the console', async () => {
        const ctx = await createTestContext(app!)
        await onPlan({ platformId: ctx.platform.id, plan: PlanName.FREE })
        const { startTrial } = stubBilling({ outcome: { result: 'started', ...STARTED } })

        const response = await ctx.get('/v1/platform-billing/self-serve-trial')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual(ELIGIBLE)
        expect(startTrial).not.toHaveBeenCalled()
    })

    it.each([PlanName.APPSUMO, PlanName.ENTERPRISE, PlanName.PLUS_CHAT])('offers no trial to a %s platform and never asks the console', async (plan) => {
        const ctx = await createTestContext(app!)
        await onPlan({ platformId: ctx.platform.id, plan })
        const { startTrial } = stubBilling({ outcome: { result: 'started', ...STARTED } })

        const status = await ctx.get('/v1/platform-billing/self-serve-trial')
        const start = await ctx.post('/v1/platform-billing/self-serve-trial/start')

        expect(status.json()).toEqual(INELIGIBLE)
        expect(start.json()).toEqual(INELIGIBLE)
        expect(startTrial).not.toHaveBeenCalled()
    })

    it('starts the trial once, and a second start returns the running trial', async () => {
        const ctx = await createTestContext(app!)
        await onPlan({ platformId: ctx.platform.id, plan: PlanName.FREE })
        const { startTrial } = stubBilling({ outcome: { result: 'started', ...STARTED } })

        const first = await ctx.post('/v1/platform-billing/self-serve-trial/start')
        const second = await ctx.post('/v1/platform-billing/self-serve-trial/start')
        const status = await ctx.get('/v1/platform-billing/self-serve-trial')

        expect(first.json()).toEqual(ACTIVE)
        expect(second.json()).toEqual(ACTIVE)
        expect(status.json()).toEqual(ACTIVE)
        expect(startTrial).toHaveBeenCalledTimes(1)
        expect(startTrial).toHaveBeenCalledWith({ autumnCustomerId: 'cus_trial', autumnApiKey: 'am_sk_trial' })
    })

    it('keeps a started trial when the refresh after it fails', async () => {
        const ctx = await createTestContext(app!)
        await onPlan({ platformId: ctx.platform.id, plan: PlanName.TEAM })
        const { startTrial } = stubBilling({ outcome: { result: 'started', ...STARTED } })
        vi.spyOn(autumnUtils, 'refreshEntitlements').mockRejectedValue(new Error('autumn timeout'))

        const start = await ctx.post('/v1/platform-billing/self-serve-trial/start')
        const again = await ctx.post('/v1/platform-billing/self-serve-trial/start')

        expect(start.json()).toEqual(ACTIVE)
        expect(again.json()).toEqual(ACTIVE)
        expect(startTrial).toHaveBeenCalledTimes(1)
    })

    it('remembers a start the console refuses as used and stops offering the trial', async () => {
        const ctx = await createTestContext(app!)
        await onPlan({ platformId: ctx.platform.id, plan: PlanName.FREE })
        const { startTrial } = stubBilling({ outcome: { result: 'used' } })

        const first = await ctx.post('/v1/platform-billing/self-serve-trial/start')
        const status = await ctx.get('/v1/platform-billing/self-serve-trial')
        const second = await ctx.post('/v1/platform-billing/self-serve-trial/start')

        expect(first.json()).toEqual(USED)
        expect(status.json()).toEqual(USED)
        expect(second.json()).toEqual(USED)
        expect(startTrial).toHaveBeenCalledTimes(1)
    })

    it('shows the running trial to every member on the platform, and nothing before it starts', async () => {
        const ctx = await createTestContext(app!)
        const member = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.EDITOR })
        await onPlan({ platformId: ctx.platform.id, plan: PlanName.FREE })
        stubBilling({ outcome: { result: 'started', ...STARTED } })

        const before = await member.get(`/v1/platforms/${ctx.platform.id}`)
        await ctx.post('/v1/platform-billing/self-serve-trial/start')
        const after = await member.get(`/v1/platforms/${ctx.platform.id}`)

        expect(before.json().selfServeTrial).toBeUndefined()
        expect(after.json().selfServeTrial).toEqual(STARTED)
    })
})
