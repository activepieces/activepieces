import { ApEdition, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetEdition = vi.fn()
const mockShouldBlockOnCredits = vi.fn()

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: {
        getEdition: () => mockGetEdition(),
    },
}))

import { billingProvider, shouldBlockRunOnCredits } from '../../../../src/app/platform/billing-provider'

const log = { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as FastifyBaseLogger
const noopProvider = billingProvider.get(log)

function gate(environment: RunEnvironment) {
    return shouldBlockRunOnCredits({ platformId: 'platform-1', environment, log })
}

describe('shouldBlockRunOnCredits', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockShouldBlockOnCredits.mockResolvedValue(true)
        billingProvider.set(() => ({ ...noopProvider, shouldBlockOnCredits: mockShouldBlockOnCredits }))
    })

    it('skips the provider entirely on self-hosted enterprise', async () => {
        mockGetEdition.mockReturnValue(ApEdition.ENTERPRISE)

        await expect(gate(RunEnvironment.PRODUCTION)).resolves.toBe(false)
        expect(mockShouldBlockOnCredits).not.toHaveBeenCalled()
    })

    it('blocks an exhausted platform on cloud', async () => {
        mockGetEdition.mockReturnValue(ApEdition.CLOUD)

        await expect(gate(RunEnvironment.PRODUCTION)).resolves.toBe(true)
        expect(mockShouldBlockOnCredits).toHaveBeenCalledWith('platform-1')
    })

    it('never gates a testing run', async () => {
        mockGetEdition.mockReturnValue(ApEdition.CLOUD)

        await expect(gate(RunEnvironment.TESTING)).resolves.toBe(false)
        expect(mockShouldBlockOnCredits).not.toHaveBeenCalled()
    })
})
