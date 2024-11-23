import { exec } from 'child_process'
import os from 'os'
import { promisify } from 'util'
import { networkUtls } from '@activepieces/server-shared'
import { MachineInformation, WorkerMachineHealthcheckRequest } from '@activepieces/shared'

const execAsync = promisify(exec)

async function getSystemInfo(): Promise<WorkerMachineHealthcheckRequest> {
    const totalRamInBytes = os.totalmem()
    const freeRamInBytes = os.freemem()
    const ramInBytes = totalRamInBytes - freeRamInBytes
    const ramUsage = (ramInBytes / totalRamInBytes) * 100

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
    }
}

export const heartbeat = {
    getSystemInfo,
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
            const [, total, , used, , ] = stdout.trim().split(/\s+/)

            const totalBytes = parseInt(total) * 1024
            const usedBytes = parseInt(used) * 1024
            const freeBytes = totalBytes - usedBytes

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
