import { memoryQueue } from '../memory/memory-queue'
import { redisQueue } from '../redis/redis-queue'
import { QueueMode, system, SystemProp } from '@activepieces/server-shared'

const systemMode = system.getOrThrow(SystemProp.QUEUE_MODE)
export const flowQueue = systemMode == QueueMode.MEMORY ? memoryQueue : redisQueue

