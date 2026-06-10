import os from 'os'
import { systemUsage } from '../src/system-usage'

vi.mock('fs', () => ({
    default: {
        promises: {
            readFile: vi.fn(),
        },
    },
}))

vi.mock('../src/file-system-utils', () => ({
    fileSystemUtils: {
        fileExists: vi.fn().mockResolvedValue(false),
    },
}))

vi.mock('systeminformation', () => ({
    default: {
        mem: vi.fn(),
    },
}))

vi.mock('check-disk-space', () => ({
    default: vi.fn(),
}))

import fs from 'fs'
import checkDiskSpace from 'check-disk-space'
import si from 'systeminformation'
import { fileSystemUtils } from '../src/file-system-utils'

const mockFileExists = vi.mocked(fileSystemUtils.fileExists)
const mockReadFile = vi.mocked(fs.promises.readFile)
const mockMem = vi.mocked(si.mem)
const mockCheckDiskSpace = vi.mocked(checkDiskSpace)

function mockCgroupFile(path: string, content: string) {
    mockFileExists.mockImplementation(async (p: string) => p === path)
    mockReadFile.mockImplementation(async (p: unknown) => {
        if (p === path) return content as never
        throw new Error('ENOENT')
    })
}

function mockCgroupFiles(files: Record<string, string>) {
    const paths = new Set(Object.keys(files))
    mockFileExists.mockImplementation(async (p: string) => paths.has(p))
    mockReadFile.mockImplementation(async (p: unknown) => {
        if (typeof p === 'string' && paths.has(p)) return files[p] as never
        throw new Error('ENOENT')
    })
}

beforeEach(() => {
    vi.restoreAllMocks()
    mockFileExists.mockResolvedValue(false)
})

describe('getContainerMemoryUsage', () => {
    it('should return cgroup v2 values when limit is valid', async () => {
        const totalBytes = 1024 * 1024 * 512 // 512 MiB
        const usedBytes = 1024 * 1024 * 256  // 256 MiB
        mockCgroupFiles({
            '/sys/fs/cgroup/memory.max': String(totalBytes),
            '/sys/fs/cgroup/memory.current': String(usedBytes),
        })

        const result = await systemUsage.getContainerMemoryUsage()
        expect(result.totalRamInBytes).toBe(totalBytes)
        expect(result.ramUsage).toBeCloseTo(50)
    })

    it('should skip cgroup v1 when limit is sentinel (unlimited)', async () => {
        const sentinel = '9223372036854771712'
        mockCgroupFiles({
            '/sys/fs/cgroup/memory/memory.limit_in_bytes': sentinel,
            '/sys/fs/cgroup/memory/memory.usage_in_bytes': '100000',
        })

        mockMem.mockResolvedValue({ total: 8_000_000_000, used: 4_000_000_000 } as never)

        const result = await systemUsage.getContainerMemoryUsage()
        expect(result.totalRamInBytes).toBe(8_000_000_000)
        expect(result.ramUsage).toBeCloseTo(50)
    })

    it('should skip cgroup v2 when limit is "max"', async () => {
        mockCgroupFiles({
            '/sys/fs/cgroup/memory.max': 'max',
            '/sys/fs/cgroup/memory.current': '100000',
        })

        mockMem.mockResolvedValue({ total: 16_000_000_000, used: 8_000_000_000 } as never)

        const result = await systemUsage.getContainerMemoryUsage()
        expect(result.totalRamInBytes).toBe(16_000_000_000)
        expect(result.ramUsage).toBeCloseTo(50)
    })

    it('should use process.constrainedMemory() when valid and no cgroup', async () => {
        const constrained = 2_000_000_000
        const available = 500_000_000
        vi.stubGlobal('process', {
            ...process,
            constrainedMemory: () => constrained,
            availableMemory: () => available,
        })

        const result = await systemUsage.getContainerMemoryUsage()
        expect(result.totalRamInBytes).toBe(constrained)
        expect(result.ramUsage).toBeCloseTo(((constrained - available) / constrained) * 100)

        vi.unstubAllGlobals()
    })

    it('should skip constrainedMemory when it returns sentinel value', async () => {
        vi.stubGlobal('process', {
            ...process,
            constrainedMemory: () => 18446744073709551615,
            availableMemory: () => 0,
        })

        mockMem.mockResolvedValue({ total: 32_000_000_000, used: 16_000_000_000 } as never)

        const result = await systemUsage.getContainerMemoryUsage()
        expect(result.totalRamInBytes).toBe(32_000_000_000)
        expect(result.ramUsage).toBeCloseTo(50)

        vi.unstubAllGlobals()
    })

    it('should fallback to si.mem() when no cgroup and no constrainedMemory', async () => {
        vi.stubGlobal('process', {
            ...process,
            constrainedMemory: undefined,
        })

        mockMem.mockResolvedValue({ total: 4_000_000_000, used: 1_000_000_000 } as never)

        const result = await systemUsage.getContainerMemoryUsage()
        expect(result.totalRamInBytes).toBe(4_000_000_000)
        expect(result.ramUsage).toBeCloseTo(25)

        vi.unstubAllGlobals()
    })
})

describe('getDiskInfo', () => {
    it('should return disk info', async () => {
        mockCheckDiskSpace.mockResolvedValue({ diskPath: '/', size: 100_000_000_000, free: 40_000_000_000 })

        const result = await systemUsage.getDiskInfo()
        expect(result).toEqual({
            total: 100_000_000_000,
            free: 40_000_000_000,
            used: 60_000_000_000,
            percentage: 60,
        })
    })

    it('should fall back to cwd when root mount fails', async () => {
        mockCheckDiskSpace
            .mockRejectedValueOnce(new Error('no root mount'))
            .mockResolvedValueOnce({ diskPath: '/app', size: 50_000_000_000, free: 25_000_000_000 })

        const result = await systemUsage.getDiskInfo()
        expect(result).toEqual({
            total: 50_000_000_000,
            free: 25_000_000_000,
            used: 25_000_000_000,
            percentage: 50,
        })
    })

    it('should return zeros when all disk lookups fail', async () => {
        mockCheckDiskSpace.mockRejectedValue(new Error('disk error'))

        const result = await systemUsage.getDiskInfo()
        expect(result).toEqual({ total: 0, free: 0, used: 0, percentage: 0 })
    })
})

describe('getCpuCores', () => {
    it('should return cgroup v2 CPU cores', async () => {
        mockCgroupFile('/sys/fs/cgroup/cpu.max', '200000 100000')

        const result = await systemUsage.getCpuCores()
        expect(result).toBe(2)
    })

    it('should return cgroup v1 CPU cores', async () => {
        mockCgroupFiles({
            '/sys/fs/cgroup/cpu/cpu.cfs_quota_us': '400000',
            '/sys/fs/cgroup/cpu/cpu.cfs_period_us': '100000',
        })

        const result = await systemUsage.getCpuCores()
        expect(result).toBe(4)
    })

    it('should fallback to os.availableParallelism()', async () => {
        const result = await systemUsage.getCpuCores()
        expect(result).toBe(os.availableParallelism?.() ?? os.cpus().length)
    })
})

describe('getCpuUsage', () => {
    it('should return a percentage between 0 and 100', () => {
        const result = systemUsage.getCpuUsage()
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(100)
    })
})
