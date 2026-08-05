import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { platformPlanRepo, platformPlanService } from '../../../../src/app/ee/platform/platform-plan/platform-plan.service'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('platformPlanService.update() does not clobber concurrent credential writes', () => {
    it('keeps credentials committed by another request mid-update', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup()
        await platformPlanRepo().update({ platformId: mockPlatform.id }, {
            autumnCustomerId: 'cus_free',
            autumnApiKey: 'key_free',
        })

        const repo = platformPlanRepo()
        const realFindOneByOrFail = repo.findOneByOrFail.bind(repo)
        let activationCommitted = false
        const seam = vi.spyOn(repo, 'findOneByOrFail').mockImplementation(async (where) => {
            const row = await realFindOneByOrFail(where)
            if (!activationCommitted) {
                activationCommitted = true
                await platformPlanRepo().update({ platformId: mockPlatform.id }, {
                    autumnCustomerId: 'cus_ent',
                    autumnApiKey: 'key_ent',
                })
            }
            return row
        })

        try {
            await platformPlanService(mockLog).update({ platformId: mockPlatform.id, activeFlowsLimit: 7 })
        }
        finally {
            seam.mockRestore()
        }

        expect(activationCommitted).toBe(true)
        const row = await platformPlanRepo().findOneByOrFail({ platformId: mockPlatform.id })
        expect(row.autumnCustomerId).toBe('cus_ent')
        expect(row.autumnApiKey).toBe('key_ent')
        expect(row.activeFlowsLimit).toBe(7)
    })

    it('writes NULL for a key passed as undefined', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup()
        await platformPlanService(mockLog).update({ platformId: mockPlatform.id, usersLimit: 12 })

        await platformPlanService(mockLog).update({ platformId: mockPlatform.id, usersLimit: undefined })

        const row = await platformPlanRepo().findOneByOrFail({ platformId: mockPlatform.id })
        expect(row.usersLimit).toBeNull()
    })

    it('returns the row for an empty payload', async () => {
        const { mockPlatform } = await mockAndSaveBasicSetup()

        const result = await platformPlanService(mockLog).update({ platformId: mockPlatform.id })

        expect(result.platformId).toBe(mockPlatform.id)
    })
})
