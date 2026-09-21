import fs from 'fs'
import os from 'os'
import { tryCatch } from '@activepieces/core-utils';
import { MachineInformation } from '@activepieces/shared';
import checkDiskSpace from 'check-disk-space'
import si from 'systeminformation'
import { fileSystemUtils } from './file-system-utils'

const MAX_REASONABLE_MEMORY_BYTES = 4 * 1024 ** 4 // 4 TiB
const PROC_SCAN_CONCURRENCY = 256

let prevCpuUsage = process.cpuUsage()
let prevTimestamp = Date.now()
let prevNodeCpu: CpuCounters = { steal: 0, total: 0 }
let prevCfsThrottle: CfsCounters = { throttled: 0, periods: 0 }

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

// /proc/stat is NOT namespaced — a container reads the whole node's CPU counters, including
// `steal`: time the hypervisor ran another tenant while this VM's vCPU was runnable. That is the
// noisy-neighbor tax on shared-CPU machine types (e.g. GCE E2), invisible to plain usage%.
async function readNodeCpuCounters(): Promise<CpuCounters | null> {
    const content = await readCgroupFile('/proc/stat')
    if (!content) return null
    const cpuLine = content.split('\n').find(line => line.startsWith('cpu '))
    if (!cpuLine) return null
    const fields = cpuLine.trim().split(/\s+/).slice(1).map(Number)
    if (fields.length < 8 || fields.some(isNaN)) return null
    return { steal: fields[7], total: fields.reduce((sum, value) => sum + value, 0) }
}

// This container's own CFS throttling: the share of enforcement periods in which it hit its CPU
// limit and was stalled until the next period — latency the k8s limit adds in ~100ms quanta.
async function readCfsThrottleCounters(): Promise<CfsCounters | null> {
    for (const path of ['/sys/fs/cgroup/cpu.stat', '/sys/fs/cgroup/cpu/cpu.stat']) {
        const periods = await readCgroupStatValue(path, 'nr_periods')
        const throttled = await readCgroupStatValue(path, 'nr_throttled')
        if (periods !== null && throttled !== null && periods > 0) {
            return { throttled, periods }
        }
    }
    return null
}

function counterRatioPercent({ previous, current, numeratorKey, denominatorKey }: { previous: Record<string, number>, current: Record<string, number>, numeratorKey: string, denominatorKey: string }): number | null {
    const denominatorDelta = current[denominatorKey] - previous[denominatorKey]
    if (denominatorDelta <= 0) return null
    const numeratorDelta = Math.max(0, current[numeratorKey] - previous[numeratorKey])
    return Math.min(100, (numeratorDelta / denominatorDelta) * 100)
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

    // CPU pressure the usage% cannot show: hypervisor steal (neighbor contention on shared-CPU
    // nodes) and CFS throttling (own CPU limit). Undefined when the counters are unavailable
    // (non-Linux dev machines, no cgroup limit).
    async getCpuPressure(): Promise<CpuPressure> {
        const [nodeCpu, cfsThrottle] = await Promise.all([readNodeCpuCounters(), readCfsThrottleCounters()])
        let cpuStealPercentage: number | undefined
        if (nodeCpu) {
            cpuStealPercentage = counterRatioPercent({ previous: prevNodeCpu, current: nodeCpu, numeratorKey: 'steal', denominatorKey: 'total' }) ?? undefined
            prevNodeCpu = nodeCpu
        }
        let cpuThrottledPercentage: number | undefined
        if (cfsThrottle) {
            cpuThrottledPercentage = counterRatioPercent({ previous: prevCfsThrottle, current: cfsThrottle, numeratorKey: 'throttled', denominatorKey: 'periods' }) ?? undefined
            prevCfsThrottle = cfsThrottle
        }
        return { cpuStealPercentage, cpuThrottledPercentage }
    },

    async getProcessTreeMemoryBytesByPids(pids: number[]): Promise<Map<number, number>> {
        const result = new Map<number, number>()
        if (pids.length === 0) {
            return result
        }
        const processTable = await readProcessTable()
        if (!processTable) {
            for (const pid of pids) {
                result.set(pid, 0)
            }
            return result
        }
        for (const pid of pids) {
            result.set(pid, sumProcessTreeRssBytes({ rootPid: pid, ...processTable }))
        }
        return result
    },
}

async function readProcessTable(): Promise<ProcessTable | null> {
    const procTable = await readProcessTableFromProc()
    if (procTable) {
        return procTable
    }
    if (process.platform === 'linux') {
        return null
    }
    return readProcessTableFromSystemInformation()
}

async function readProcessTableFromProc(): Promise<ProcessTable | null> {
    if (process.platform !== 'linux') {
        return null
    }
    const { data: entries, error } = await tryCatch(() => fs.promises.readdir('/proc'))
    if (error || !entries) {
        return null
    }
    const pids = entries
        .filter((entry) => /^\d+$/.test(entry))
        .map((entry) => Number(entry))
    const statuses = await mapWithConcurrency({ items: pids, concurrency: PROC_SCAN_CONCURRENCY, fn: readProcessStatus })
    const rssBytesByPid = new Map<number, number>()
    const childrenByParent = new Map<number, number[]>()
    for (const status of statuses) {
        if (!status) {
            continue
        }
        rssBytesByPid.set(status.pid, status.rssBytes)
        const siblings = childrenByParent.get(status.ppid) ?? []
        siblings.push(status.pid)
        childrenByParent.set(status.ppid, siblings)
    }
    return { rssBytesByPid, childrenByParent }
}

async function readProcessTableFromSystemInformation(): Promise<ProcessTable | null> {
    const { data, error } = await tryCatch(() => si.processes())
    if (error || !data) {
        return null
    }
    const rssBytesByPid = new Map<number, number>()
    const childrenByParent = new Map<number, number[]>()
    for (const proc of data.list) {
        rssBytesByPid.set(proc.pid, proc.memRss * 1024)
        const siblings = childrenByParent.get(proc.parentPid) ?? []
        siblings.push(proc.pid)
        childrenByParent.set(proc.parentPid, siblings)
    }
    return { rssBytesByPid, childrenByParent }
}

async function readProcessStatus(pid: number): Promise<ProcessStatus | null> {
    const { data, error } = await tryCatch(() => fs.promises.readFile(`/proc/${pid}/status`, 'utf8'))
    if (error || !data) {
        return null
    }
    return parseProcessStatus(pid, data)
}

function parseProcessStatus(pid: number, content: string): ProcessStatus {
    const ppidMatch = /^PPid:\s+(\d+)/m.exec(content)
    const rssMatch = /^VmRSS:\s+(\d+)/m.exec(content)
    return {
        pid,
        ppid: ppidMatch ? Number(ppidMatch[1]) : 0,
        rssBytes: (rssMatch ? Number(rssMatch[1]) : 0) * 1024,
    }
}

async function mapWithConcurrency<T, R>({ items, concurrency, fn }: { items: T[], concurrency: number, fn: (item: T) => Promise<R> }): Promise<R[]> {
    const results: R[] = new Array(items.length)
    let nextIndex = 0
    const worker = async () => {
        while (nextIndex < items.length) {
            const index = nextIndex
            nextIndex += 1
            results[index] = await fn(items[index])
        }
    }
    const workerCount = Math.min(concurrency, items.length)
    await Promise.all(Array.from({ length: workerCount }, () => worker()))
    return results
}

type CpuCounters = { steal: number, total: number }
type CfsCounters = { throttled: number, periods: number }
export type CpuPressure = { cpuStealPercentage?: number, cpuThrottledPercentage?: number }
type ProcessTable = {
    rssBytesByPid: Map<number, number>
    childrenByParent: Map<number, number[]>
}
type ProcessStatus = {
    pid: number
    ppid: number
    rssBytes: number
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
