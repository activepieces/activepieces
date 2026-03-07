import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'
import { promisify } from 'util'
import { MachineInformation, tryCatch } from '@activepieces/shared'
import { fileSystemUtils } from './file-system-utils'

const execAsync = promisify(exec)

export const systemUsage = {
    async calcMemory(memLimitPath: string, memUsagePath: string) {
        const { data, error } = await tryCatch(async () => {
            const exists = await fileSystemUtils.fileExists(memLimitPath) && await fileSystemUtils.fileExists(memUsagePath)
            if (!exists) return null
            const memLimit = await fs.promises.readFile(memLimitPath, 'utf8')
            if (memLimit.trim() === 'max') return null
            const memUsage = await fs.promises.readFile(memUsagePath, 'utf8')
            return {
                totalRamInBytes: parseInt(memLimit),
                ramUsage: (parseInt(memUsage) / parseInt(memLimit)) * 100,
            }
        })
        if (error) return null
        return data
    },

    async getContainerMemoryUsage() {
        const memLimitPathV1 = '/sys/fs/cgroup/memory/memory.limit_in_bytes'
        const memUsagePathV1 = '/sys/fs/cgroup/memory/memory.usage_in_bytes'

        const memLimitPathV2 = '/sys/fs/cgroup/memory.max'
        const memUsagePathV2 = '/sys/fs/cgroup/memory.current'

        const memoryV2 = await systemUsage.calcMemory(memLimitPathV2, memUsagePathV2)
        if (memoryV2) return memoryV2

        const memoryV1 = await systemUsage.calcMemory(memLimitPathV1, memUsagePathV1)
        if (memoryV1) return memoryV1

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
        const cpus = os.cpus()
        return cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0)
            const idle = cpu.times.idle
            return acc + (1 - idle / total)
        }, 0) / cpus.length * 100
    },

    async getCpuCores(): Promise<number> {
        const cgroupV2Path = '/sys/fs/cgroup/cpu.max'
        const quotaPath = '/sys/fs/cgroup/cpu/cpu.cfs_quota_us'
        const periodPath = '/sys/fs/cgroup/cpu/cpu.cfs_period_us'

        const { data, error } = await tryCatch(async () => {
            if (await fileSystemUtils.fileExists(cgroupV2Path)) {
                const content = await fs.promises.readFile(cgroupV2Path, 'utf8')
                const [quota, period] = content.trim().split(' ')
                if (quota !== 'max') {
                    return parseInt(quota) / parseInt(period)
                }
            }
            else if (await fileSystemUtils.fileExists(quotaPath) && await fileSystemUtils.fileExists(periodPath)) {
                const quota = parseInt(await fs.promises.readFile(quotaPath, 'utf8'))
                const period = parseInt(await fs.promises.readFile(periodPath, 'utf8'))
                if (quota > 0) {
                    return quota / period
                }
            }
            return null
        })
        if (error || data === null) {
            return os.cpus().length
        }
        return data
    },
}
