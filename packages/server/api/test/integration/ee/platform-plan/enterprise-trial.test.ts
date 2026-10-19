import { EnterpriseTrialStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { autumnConsole, autumnUtils } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const ELIGIBLE: EnterpriseTrialStatus = { state: 'eligible', startedAt: null, endsAt: null, extended: false }
const STARTED = { startedAt: '2026-10-14T09:00:00.000Z', endsAt: '2099-10-21T09:00:00.000Z' }

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

describe('Enterprise trial API', () => {
    it('reads the trial as a self-hosted Enterprise instance and starts it with the instance billing key', async () => {
        const ctx = await createTestContext(app!)
        vi.spyOn(autumnUtils, 'ensureEnrolled').mockResolvedValue(undefined)
        vi.spyOn(autumnUtils, 'refreshEntitlements').mockResolvedValue(undefined)
        vi.spyOn(autumnConsole, 'getCreds').mockResolvedValue({ autumnCustomerId: 'cus_trial', autumnApiKey: 'am_sk_trial' })
        const startTrial = vi.spyOn(autumnConsole, 'startEnterpriseTrial').mockResolvedValue(STARTED)

        const status = await ctx.get('/v1/platform-billing/enterprise-trial')
        const start = await ctx.post('/v1/platform-billing/enterprise-trial/start')

        expect(status.statusCode).toBe(StatusCodes.OK)
        expect(status.json()).toEqual(ELIGIBLE)
        expect(start.json()).toEqual({ state: 'active', ...STARTED, extended: false })
        expect(startTrial).toHaveBeenCalledWith({ autumnCustomerId: 'cus_trial', autumnApiKey: 'am_sk_trial' })
    })
})
