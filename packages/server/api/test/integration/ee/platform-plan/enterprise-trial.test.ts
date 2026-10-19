import { EnterpriseTrialStatus } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { autumnConsole, autumnUtils } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const ELIGIBLE: EnterpriseTrialStatus = { state: 'eligible', startedAt: null, endsAt: null, extended: false }

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
    it('reads the trial from the console as a self-hosted Enterprise instance', async () => {
        const ctx = await createTestContext(app!)
        vi.spyOn(autumnUtils, 'ensureEnrolled').mockResolvedValue(undefined)
        vi.spyOn(autumnConsole, 'getCreds').mockResolvedValue({ autumnCustomerId: 'cus_trial', autumnApiKey: 'am_sk_trial' })
        const getTrial = vi.spyOn(autumnConsole, 'getEnterpriseTrial').mockResolvedValue(ELIGIBLE)

        const response = await ctx.get('/v1/platform-billing/enterprise-trial')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()).toEqual(ELIGIBLE)
        expect(getTrial).toHaveBeenCalledWith(expect.objectContaining({
            autumnApiKey: 'am_sk_trial',
            edition: 'ee',
        }))
    })
})
