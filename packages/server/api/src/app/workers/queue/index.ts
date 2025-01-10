import { QueueMode, system } from '../../helper/system/system'
import { AppSystemProp } from '@activepieces/server-shared'
import { memoryQueue } from '../memory/memory-queue'
import { redisQueue } from '../redis/redis-queue'

const systemMode = system.getOrThrow(AppSystemProp.QUEUE_MODE)
export const jobQueue = systemMode == QueueMode.MEMORY ? memoryQueue : redisQueue

