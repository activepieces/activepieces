import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFind = vi.fn()
const mockUpdate = vi.fn()
const mockPlatformPlanServiceUpdate = vi.fn()

vi.mock('../../../../../src/app/ee/platform/platform-plan/platform-plan.service', () => ({
    platformPlanRepo: () => ({
        find: mockFind,
        update: mockUpdate,
    }),
    platformPlanService: () => ({
        update: mockPlatformPlanServiceUpdate,
    }),
}))

const mockLog: FastifyBaseLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as unknown as FastifyBaseLogger

type CanaryService = ReturnType<typeof import('../../../../../src/app/core/canary/platform-canary.service').platformCanaryService>

async function loadService(): Promise<CanaryService> {
    const mod = await import('../../../../../src/app/core/canary/platform-canary.service')
    return mod.platformCanaryService(mockLog)
}

describe('platformCanaryService', () => {
    let service: CanaryService

    beforeEach(async () => {
        vi.clearAllMocks()
        vi.resetModules()
        service = await loadService()
    })

    it('returns true for canary platform', async () => {
        mockFind.mockResolvedValue([{ platformId: 'p1' }])

        const result = await service.shouldForwardToCanary({ platformId: 'p1' })

        expect(result).toBe(true)
    })

    it('returns false for non-canary platform', async () => {
        mockFind.mockResolvedValue([{ platformId: 'p1' }])

        const result = await service.shouldForwardToCanary({ platformId: 'p2' })

        expect(result).toBe(false)
    })

    it('caches after first call', async () => {
        mockFind.mockResolvedValue([{ platformId: 'p1' }])

        await service.shouldForwardToCanary({ platformId: 'p1' })
        await service.shouldForwardToCanary({ platformId: 'p1' })

        expect(mockFind).toHaveBeenCalledTimes(1)
    })

    it('concurrent calls only hit DB once', async () => {
        let resolveFind!: (value: { platformId: string }[]) => void
        mockFind.mockReturnValue(new Promise((resolve) => {
            resolveFind = resolve
        }))

        const promises = Array.from({ length: 10 }, () =>
            service.shouldForwardToCanary({ platformId: 'p1' }),
        )

        // Let all callers enter the lock before the DB responds
        await new Promise((r) => setTimeout(r, 50))
        resolveFind([{ platformId: 'p1' }])

        const results = await Promise.all(promises)

        expect(mockFind).toHaveBeenCalledTimes(1)
        expect(results.every((r) => r === true)).toBe(true)
    })

    it('updateCanary invalidates cache', async () => {
        mockFind.mockResolvedValue([{ platformId: 'p1' }])
        mockPlatformPlanServiceUpdate.mockResolvedValue(undefined)

        await service.shouldForwardToCanary({ platformId: 'p1' })
        expect(mockFind).toHaveBeenCalledTimes(1)

        await service.updateCanary({ platformId: 'p1', canary: false })

        mockFind.mockResolvedValue([])
        await service.shouldForwardToCanary({ platformId: 'p1' })
        expect(mockFind).toHaveBeenCalledTimes(2)
    })

    it('disableAll invalidates cache', async () => {
        mockFind.mockResolvedValue([{ platformId: 'p1' }])
        mockUpdate.mockResolvedValue(undefined)

        await service.shouldForwardToCanary({ platformId: 'p1' })
        expect(mockFind).toHaveBeenCalledTimes(1)

        await service.disableAll()

        mockFind.mockResolvedValue([])
        await service.shouldForwardToCanary({ platformId: 'p1' })
        expect(mockFind).toHaveBeenCalledTimes(2)
    })
})
