import { memoryQueue } from '../memory/memory-queue'
import { redisQueue } from '../redis/redis-queue'
import { AppSystemProp, QueueMode, system } from '@activepieces/server-shared'

const systemMode = system.getOrThrow(AppSystemProp.QUEUE_MODE)
export const flowQueue = systemMode == QueueMode.MEMORY ? memoryQueue : redisQueue

