import { QueueMode, system, SystemProp } from '@activepieces/server-shared'
import { SystemJobSchedule } from './common'
import { memorySystemJobSchedulerService } from './memory-system-jobs'
import { redisSystemJobSchedulerService } from './redis-system-job'


const queueMode = system.get<QueueMode>(SystemProp.QUEUE_MODE)

export const systemJobsSchedule: SystemJobSchedule = (() => {
    switch (queueMode) {
        case QueueMode.REDIS:
            return redisSystemJobSchedulerService
        case QueueMode.MEMORY:
            return memorySystemJobSchedulerService
        default:
            throw new Error(`Invalid queue mode: ${queueMode}`)
    }
})()
