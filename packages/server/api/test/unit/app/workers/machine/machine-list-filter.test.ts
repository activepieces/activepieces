import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MachineInformation, WorkerMachineStatus, WorkerMachineType } from '@activepieces/shared'
import { workerMachineCache } from '../../../../../src/app/workers/machine/machine-cache'
import { machineService } from '../../../../../src/app/workers/machine/machine-service'

const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(),
} as never

function fakeMachineInfo(workerId: string): MachineInformation {
    return {
        workerId,
        cpuUsagePercentage: 0,
        ramUsagePercentage: 0,
        totalAvailableRamInBytes: 0,
        totalCpuCores: 1,
        ip: '127.0.0.1',
        diskInfo: { total: 100, free: 50, used: 50, percentage: 50 },
        workerProps: {},
    }
}

describe('machineService.list — platform filtering', () => {
    beforeEach(async () => {
        const cache = workerMachineCache()
        const all = await cache.find()
        if (all.length > 0) {
            await cache.delete(all.map(w => w.id))
        }
    })

    it('should return shared workers for any platform', async () => {
        await workerMachineCache().upsert({
            id: 'shared-1',
            information: fakeMachineInfo('shared-1'),

            type: 'SHARED',
        })

        const result = await machineService(mockLogger).list('platform-A')

        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('shared-1')
        expect(result[0].type).toBe(WorkerMachineType.SHARED)
        expect(result[0].status).toBe(WorkerMachineStatus.ONLINE)
    })

    it('should return dedicated workers only for the matching platform', async () => {
        await workerMachineCache().upsert({
            id: 'dedicated-A',
            information: fakeMachineInfo('dedicated-A'),

            type: 'DEDICATED',
            platformId: 'platform-A',
        })

        await workerMachineCache().upsert({
            id: 'dedicated-B',
            information: fakeMachineInfo('dedicated-B'),

            type: 'DEDICATED',
            platformId: 'platform-B',
        })

        const resultA = await machineService(mockLogger).list('platform-A')
        expect(resultA).toHaveLength(1)
        expect(resultA[0].id).toBe('dedicated-A')
        expect(resultA[0].type).toBe(WorkerMachineType.DEDICATED)

        const resultB = await machineService(mockLogger).list('platform-B')
        expect(resultB).toHaveLength(1)
        expect(resultB[0].id).toBe('dedicated-B')
    })

    it('should not return other platforms dedicated workers', async () => {
        await workerMachineCache().upsert({
            id: 'dedicated-other',
            information: fakeMachineInfo('dedicated-other'),

            type: 'DEDICATED',
            platformId: 'platform-other',
        })

        const result = await machineService(mockLogger).list('platform-mine')
        expect(result).toHaveLength(0)
    })

    it('should return both shared and own dedicated workers', async () => {
        await workerMachineCache().upsert({
            id: 'shared-1',
            information: fakeMachineInfo('shared-1'),

            type: 'SHARED',
        })

        await workerMachineCache().upsert({
            id: 'dedicated-mine',
            information: fakeMachineInfo('dedicated-mine'),

            type: 'DEDICATED',
            platformId: 'platform-X',
        })

        await workerMachineCache().upsert({
            id: 'dedicated-other',
            information: fakeMachineInfo('dedicated-other'),

            type: 'DEDICATED',
            platformId: 'platform-Y',
        })

        const result = await machineService(mockLogger).list('platform-X')
        expect(result).toHaveLength(2)

        const ids = result.map(w => w.id).sort()
        expect(ids).toEqual(['dedicated-mine', 'shared-1'])
    })

    it('should include legacy workers with no type as shared', async () => {
        await workerMachineCache().upsert({
            id: 'legacy-worker',
            information: fakeMachineInfo('legacy-worker'),

        })

        const result = await machineService(mockLogger).list('any-platform')
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('legacy-worker')
        expect(result[0].type).toBe(WorkerMachineType.SHARED)
    })
})
