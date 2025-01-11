import { AppSystemProp } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import { QueueMode, system } from '../system/system'
import { SystemJobSchedule } from './common'
import { memorySystemJobSchedulerService } from './memory-system-jobs'
import { redisSystemJobSchedulerService } from './redis-system-job'


const queueMode = system.get<QueueMode>(AppSystemProp.QUEUE_MODE)

export const systemJobsSchedule = (log: FastifyBaseLogger): SystemJobSchedule => {
    switch (queueMode) {
        case QueueMode.REDIS:
            return redisSystemJobSchedulerService(log)
        case QueueMode.MEMORY:
            return memorySystemJobSchedulerService(log)
        default:
            throw new Error(`Invalid queue mode: ${queueMode}`)
    }
}
