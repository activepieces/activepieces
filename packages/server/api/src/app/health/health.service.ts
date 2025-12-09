import { getContainerMemoryUsage, getCpuCores, getDiskInfo } from '@activepieces/server-shared'
import { GetSystemHealthChecksResponse, isNil, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { smtpEmailSender } from '../ee/helper/email/email-sender/smtp-email-sender'
import { system } from '../helper/system/system'

let workerHealthStatus = false

export const healthStatusService = (log: FastifyBaseLogger) => ({
    markWorkerHealthy: async (): Promise<void> => {
        workerHealthStatus = true
    },
    isHealthy: (): boolean => {
        if (system.isWorker()) {
            return workerHealthStatus
        }
        return true
    },
    getSystemHealthChecks: async (): Promise<GetSystemHealthChecksResponse> => {
        const smtp = await tryCatch(smtpEmailSender(log).validateOrThrow)

        return {
            cpu: await getCpuCores() >= 1,
            disk: (await getDiskInfo()).total > gigaBytes(30),
            ram: (await getContainerMemoryUsage()).totalRamInBytes > gigaBytes(4),
            smtp: !isNil(smtp.data),
        }
    },
})

const gigaBytes = (value: number) => value * 1024 * 1024 * 1024