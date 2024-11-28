import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'
import { promisify } from 'util'
import { fileExists, networkUtls, system, WorkerSystemProps } from '@activepieces/server-shared'
import { MachineInformation, WorkerMachineHealthcheckRequest } from '@activepieces/shared'

const execAsync = promisify(exec)

async function getSystemInfo(): Promise<WorkerMachineHealthcheckRequest> {
    const { totalRamInBytes, ramUsage } = await getContainerMemoryUsage()

    const cpus = os.cpus()
    const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0)
        const idle = cpu.times.idle
        return acc + (1 - idle / total)
    }, 0) / cpus.length * 100

    const ip = (await networkUtls.getPublicIp()).ip
    const diskInfo = await getDiskInfo()

    return {
        diskInfo,
        cpuUsagePercentage: cpuUsage,
        ramUsagePercentage: ramUsage,
        totalAvailableRamInBytes: totalRamInBytes,
        ip,
        workerProps: {
            FLOW_WORKER_CONCURRENCY: system.getOrThrow<string>(WorkerSystemProps.FLOW_WORKER_CONCURRENCY),
            POLLING_POOL_SIZE: system.getOrThrow<string>(WorkerSystemProps.POLLING_POOL_SIZE),
            SCHEDULED_WORKER_CONCURRENCY: system.getOrThrow<string>(WorkerSystemProps.SCHEDULED_WORKER_CONCURRENCY),
        },
    }
}

export const heartbeat = {
    getSystemInfo,
}

async function getContainerMemoryUsage() {
    const memLimitPath = '/sys/fs/cgroup/memory/memory.limit_in_bytes'
    const memUsagePath = '/sys/fs/cgroup/memory/memory.usage_in_bytes'

    const memLimitExists = await fileExists(memLimitPath)
    const memUsageExists = await fileExists(memUsagePath)


    const totalRamInBytes = memLimitExists ? parseInt(await fs.promises.readFile(memLimitPath, 'utf8')) : os.totalmem()
    const usedRamInBytes = memUsageExists ? parseInt(await fs.promises.readFile(memUsagePath, 'utf8')) : os.freemem()

    return {
        totalRamInBytes,
        ramUsage: (usedRamInBytes / totalRamInBytes) * 100,
    }
}

async function getDiskInfo(): Promise<MachineInformation['diskInfo']> {
    const platform = os.platform()

    try {
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
    }
    catch (error) {
        return {
            total: 0,
            free: 0,
            used: 0,
            percentage: 0,
        }
    }
}
