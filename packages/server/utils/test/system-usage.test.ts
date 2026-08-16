import fs from 'fs'
import os from 'os'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fileSystemUtils } from '../src/file-system-utils'
import { systemUsage } from '../src/system-usage'

const CGROUP_V2_LIMIT = '/sys/fs/cgroup/memory.max'
const CGROUP_V1_LIMIT = '/sys/fs/cgroup/memory/memory.limit_in_bytes'
const HOST_RAM_BYTES = 64 * 1024 ** 3

function mockCgroup(files: Record<string, string>): void {
    vi.spyOn(fileSystemUtils, 'fileExists').mockImplementation(async (path: string) => path in files)
    vi.spyOn(fs.promises, 'readFile').mockImplementation(async (path: unknown) => files[String(path)])
}

describe('getContainerMemoryLimitInBytes', () => {
    beforeEach(() => {
        vi.spyOn(os, 'totalmem').mockReturnValue(HOST_RAM_BYTES)
        vi.spyOn(process, 'constrainedMemory').mockReturnValue(0)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns the cgroup v2 limit when the container is capped', async () => {
        mockCgroup({ [CGROUP_V2_LIMIT]: String(1024 ** 3) })
        expect(await systemUsage.getContainerMemoryLimitInBytes()).toBe(1024 ** 3)
    })

    it('returns null when cgroup v2 reports max', async () => {
        mockCgroup({ [CGROUP_V2_LIMIT]: 'max' })
        expect(await systemUsage.getContainerMemoryLimitInBytes()).toBeNull()
    })

    it('returns null when a cgroup v1 root reports the unconstrained sentinel', async () => {
        mockCgroup({ [CGROUP_V1_LIMIT]: '9223372036854771712' })
        expect(await systemUsage.getContainerMemoryLimitInBytes()).toBeNull()
    })

    it('returns null when a cgroup v1 root reports total host RAM', async () => {
        mockCgroup({ [CGROUP_V1_LIMIT]: String(HOST_RAM_BYTES) })
        expect(await systemUsage.getContainerMemoryLimitInBytes()).toBeNull()
    })

    it('believes a cgroup v2 cap even when it equals host RAM, since v2 says max when uncapped', async () => {
        mockCgroup({ [CGROUP_V2_LIMIT]: String(HOST_RAM_BYTES) })
        expect(await systemUsage.getContainerMemoryLimitInBytes()).toBe(HOST_RAM_BYTES)
    })

    it('prefers a v2 cap over a v1 root value', async () => {
        mockCgroup({ [CGROUP_V2_LIMIT]: String(1024 ** 3), [CGROUP_V1_LIMIT]: String(HOST_RAM_BYTES) })
        expect(await systemUsage.getContainerMemoryLimitInBytes()).toBe(1024 ** 3)
    })

    it('falls through to v1 when v2 reports max', async () => {
        mockCgroup({ [CGROUP_V2_LIMIT]: 'max', [CGROUP_V1_LIMIT]: String(2 * 1024 ** 3) })
        expect(await systemUsage.getContainerMemoryLimitInBytes()).toBe(2 * 1024 ** 3)
    })

    it('returns null when no cgroup file exists at all', async () => {
        mockCgroup({})
        expect(await systemUsage.getContainerMemoryLimitInBytes()).toBeNull()
    })

    it('falls back to constrainedMemory when no cgroup file is readable', async () => {
        mockCgroup({})
        vi.spyOn(process, 'constrainedMemory').mockReturnValue(2 * 1024 ** 3)
        expect(await systemUsage.getContainerMemoryLimitInBytes()).toBe(2 * 1024 ** 3)
    })
})
