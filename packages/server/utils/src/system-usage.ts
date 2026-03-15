import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'
import { promisify } from 'util'
import { MachineInformation, tryCatch } from '@activepieces/shared'
import { fileSystemUtils } from './file-system-utils'

const execAsync = promisify(exec)

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

async function getCgroupMemory(): Promise<{ totalRamInBytes: number, ramUsage: number } | null> {
    const paths = [
        { limit: '/sys/fs/cgroup/memory.max', usage: '/sys/fs/cgroup/memory.current' },
        { limit: '/sys/fs/cgroup/memory/memory.limit_in_bytes', usage: '/sys/fs/cgroup/memory/memory.usage_in_bytes' },
    ]
    for (const { limit, usage } of paths) {
        const limitStr = await readCgroupFile(limit)
        if (!limitStr || limitStr === 'max') continue
        const usageStr = await readCgroupFile(usage)
        if (!usageStr) continue
        const totalRamInBytes = parseInt(limitStr)
        const usedBytes = parseInt(usageStr)
        if (isNaN(totalRamInBytes) || isNaN(usedBytes) || totalRamInBytes <= 0) continue
        return {
            totalRamInBytes,
            ramUsage: (usedBytes / totalRamInBytes) * 100,
        }
    }
    return null
}

function getConstrainedMemoryTotal(): number | null {
    const constrained = process.constrainedMemory?.()
    if (constrained && constrained > 0) return constrained
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

        return {
            totalRamInBytes: os.totalmem(),
            ramUsage: (os.totalmem() - os.freemem()) / os.totalmem() * 100,
        }
    },

    async getDiskInfo(): Promise<MachineInformation['diskInfo']> {
        const platform = os.platform()

        const { data, error } = await tryCatch(async () => {
            if (platform === 'win32') {
                const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption')
                const lines = stdout.trim().split('\n').slice(1)
                let total = 0, free = 0

                for (const line of lines) {
                    const [, freeSpace, size] = line.trim().split(/\s+/)
                    if (freeSpace && size) {
                        total += parseInt(size)
                        free += parseInt(freeSpace)
                    }
                }

                const used = total - free
                return {
                    total,
                    free,
                    used,
                    percentage: (used / total) * 100,
                }
            }
            else {
                const { stdout } = await execAsync('df -k / | tail -1')
                const [, blocks, used, available] = stdout.trim().split(/\s+/)

                const totalBytes = parseInt(blocks) * 1024
                const usedBytes = parseInt(used) * 1024
                const freeBytes = parseInt(available) * 1024

                return {
                    total: totalBytes,
                    free: freeBytes,
                    used: usedBytes,
                    percentage: (usedBytes / totalBytes) * 100,
                }
            }
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
}
