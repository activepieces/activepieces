import fs from 'fs'
import os from 'os'
import { tryCatch } from '@activepieces/core-utils';
import { MachineInformation } from '@activepieces/shared';
import checkDiskSpace from 'check-disk-space'
import si from 'systeminformation'
import { fileSystemUtils } from './file-system-utils'

const MAX_REASONABLE_MEMORY_BYTES = 4 * 1024 ** 4 // 4 TiB

let prevCpuUsage = process.cpuUsage()
let prevTimestamp = Date.now()

async function readCgroupFile(path: string): Promise<string | null> {
    const { data, error } = await tryCatch(async () => {
        if (!await fileSystemUtils.fileExists(path)) return null
        return (await fs.promises.readFile(path, 'utf8')).trim()
    })
    if (error) return null
    return data
}

async function readCgroupStatValue(path: string, key: string): Promise<number | null> {
    const content = await readCgroupFile(path)
    if (!content) return null
    for (const line of content.split('\n')) {
        const [name, rawValue] = line.split(' ')
        if (name === key) {
            const value = parseInt(rawValue)
            return isNaN(value) ? null : value
        }
    }
    return null
}

async function getCgroupMemory(): Promise<{ totalRamInBytes: number, ramUsage: number } | null> {
    const paths = [
        { limit: '/sys/fs/cgroup/memory.max', usage: '/sys/fs/cgroup/memory.current', stat: '/sys/fs/cgroup/memory.stat', inactiveFileKey: 'inactive_file' },
        { limit: '/sys/fs/cgroup/memory/memory.limit_in_bytes', usage: '/sys/fs/cgroup/memory/memory.usage_in_bytes', stat: '/sys/fs/cgroup/memory/memory.stat', inactiveFileKey: 'total_inactive_file' },
    ]
    for (const { limit, usage, stat, inactiveFileKey } of paths) {
        const limitStr = await readCgroupFile(limit)
        if (!limitStr || limitStr === 'max') continue
        const usageStr = await readCgroupFile(usage)
        if (!usageStr) continue
        const totalRamInBytes = parseInt(limitStr)
        const rawUsedBytes = parseInt(usageStr)
        if (isNaN(totalRamInBytes) || isNaN(rawUsedBytes) || totalRamInBytes <= 0 || totalRamInBytes > MAX_REASONABLE_MEMORY_BYTES) continue
        // When memory.stat is unreadable we keep the container-scoped cgroup usage
        // (slightly over-reported, includes cache) rather than skipping to host memory,
        // which would make a capped worker look far emptier than it is.
        const inactiveFileBytes = await readCgroupStatValue(stat, inactiveFileKey) ?? 0
        const usedBytes = Math.max(0, rawUsedBytes - inactiveFileBytes)
        return {
            totalRamInBytes,
            ramUsage: (usedBytes / totalRamInBytes) * 100,
        }
    }
    return null
}

function getConstrainedMemoryTotal(): number | null {
    const constrained = process.constrainedMemory?.()
    if (constrained && constrained > 0 && constrained <= MAX_REASONABLE_MEMORY_BYTES) return constrained
    return null
}

async function getCgroupCpuCores(): Promise<number | null> {
    const v2Content = await readCgroupFile('/sys/fs/cgroup/cpu.max')
    if (v2Content) {
        const [quota, period] = v2Content.split(' ')
        if (quota !== 'max') {
            const cores = parseInt(quota) / parseInt(period)
            if (!isNaN(cores) && cores > 0) return cores
        }
    }

    const quotaStr = await readCgroupFile('/sys/fs/cgroup/cpu/cpu.cfs_quota_us')
    const periodStr = await readCgroupFile('/sys/fs/cgroup/cpu/cpu.cfs_period_us')
    if (quotaStr && periodStr) {
        const quota = parseInt(quotaStr)
        const period = parseInt(periodStr)
        if (quota > 0 && period > 0) return quota / period
    }

    return null
}

export const systemUsage = {
    async getContainerMemoryUsage() {
        const cgroupMemory = await getCgroupMemory()
        if (cgroupMemory) return cgroupMemory

        const constrainedTotal = getConstrainedMemoryTotal()
        if (constrainedTotal) {
            const used = constrainedTotal - (process.availableMemory?.() ?? 0)
            return {
                totalRamInBytes: constrainedTotal,
                ramUsage: Math.max(0, (used / constrainedTotal) * 100),
            }
        }

        const mem = await si.mem()
        return {
            totalRamInBytes: mem.total,
            ramUsage: (mem.used / mem.total) * 100,
        }
    },

    async getDiskInfo(): Promise<MachineInformation['diskInfo']> {
        const { data, error } = await tryCatch(async () => {
            const paths = ['/', process.cwd()]
            for (const path of paths) {
                const { data: disk } = await tryCatch(() => checkDiskSpace(path))
                if (disk) {
                    const used = disk.size - disk.free
                    return {
                        total: disk.size,
                        free: disk.free,
                        used,
                        percentage: disk.size > 0 ? (used / disk.size) * 100 : 0,
                    }
                }
            }
            return { total: 0, free: 0, used: 0, percentage: 0 }
        })
        if (error) {
            return { total: 0, free: 0, used: 0, percentage: 0 }
        }
        return data
    },

    getCpuUsage(): number {
        const currentCpuUsage = process.cpuUsage(prevCpuUsage)
        const currentTimestamp = Date.now()
        const elapsedMs = currentTimestamp - prevTimestamp

        prevCpuUsage = process.cpuUsage()
        prevTimestamp = currentTimestamp

        if (elapsedMs <= 0) return 0

        const totalCpuUs = currentCpuUsage.user + currentCpuUsage.system
        const elapsedUs = elapsedMs * 1000
        return Math.min(100, (totalCpuUs / elapsedUs) * 100)
    },

    async getCpuCores(): Promise<number> {
        const cgroupCores = await getCgroupCpuCores()
        if (cgroupCores) return cgroupCores
        return os.availableParallelism?.() ?? os.cpus().length
    },

    async getProcessTreeMemoryBytesByPids(pids: number[]): Promise<Map<number, number>> {
        const result = new Map<number, number>()
        if (pids.length === 0) {
            return result
        }
        // si.processes() walks the whole process table — do it once for all pids, never per-pid.
        const { data, error } = await tryCatch(() => si.processes())
        if (error || !data) {
            for (const pid of pids) {
                result.set(pid, 0)
            }
            return result
        }
        const childrenByParent = new Map<number, number[]>()
        const rssBytesByPid = new Map<number, number>()
        for (const proc of data.list) {
            rssBytesByPid.set(proc.pid, proc.memRss * 1024)
            const siblings = childrenByParent.get(proc.parentPid) ?? []
            siblings.push(proc.pid)
            childrenByParent.set(proc.parentPid, siblings)
        }
        for (const pid of pids) {
            result.set(pid, sumProcessTreeRssBytes({ rootPid: pid, rssBytesByPid, childrenByParent }))
        }
        return result
    },
}

function sumProcessTreeRssBytes({ rootPid, rssBytesByPid, childrenByParent }: { rootPid: number, rssBytesByPid: Map<number, number>, childrenByParent: Map<number, number[]> }): number {
    let total = 0
    const queue = [rootPid]
    const visited = new Set<number>()
    while (queue.length > 0) {
        const current = queue.shift()!
        if (visited.has(current)) continue
        visited.add(current)
        total += rssBytesByPid.get(current) ?? 0
        queue.push(...(childrenByParent.get(current) ?? []))
    }
    return total
}
