import { QueueMode, SystemProp, system } from 'server-shared'
import { SystemJobSchedule } from './common'
import { redisSystemJobSchedulerService } from './redis-system-job'
import { memorySystemJobSchedulerService } from './memory-system-jobs'


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
