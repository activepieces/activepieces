import { ErrorCode } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assertCreditsNotExceeded, billingProvider, CreditsGateState } from '../../../../src/app/platform/billing-provider'

const log = { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as FastifyBaseLogger
const noopProvider = billingProvider.get(log)

function gateState({ blocked }: { blocked: boolean }): CreditsGateState {
    return { blocked, metered: true, usage: 10, limit: 10, remaining: blocked ? 0 : 5, unlimited: false }
}

function withState({ creditsBlocked, appSumoBlocked }: { creditsBlocked: boolean, appSumoBlocked: boolean }): void {
    billingProvider.set(() => ({
        ...noopProvider,
        getCreditsAndAppSumoState: async () => ({
            credits: gateState({ blocked: creditsBlocked }),
            appSumo: gateState({ blocked: appSumoBlocked }),
        }),
    }))
}

describe('assertCreditsNotExceeded', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('lets the call through when only the AppSumo AI-credit meter is exhausted', async () => {
        withState({ creditsBlocked: false, appSumoBlocked: true })

        await expect(assertCreditsNotExceeded({ platformId: 'platform-1', log })).resolves.toBeUndefined()
    })

    it('refuses with QUOTA_EXCEEDED when the platform credits are exhausted', async () => {
        withState({ creditsBlocked: true, appSumoBlocked: false })

        await expect(assertCreditsNotExceeded({ platformId: 'platform-1', log })).rejects.toMatchObject({
            error: { code: ErrorCode.QUOTA_EXCEEDED },
        })
    })
})
