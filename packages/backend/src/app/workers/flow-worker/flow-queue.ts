import { QueueMode, system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { inMemoryQueueManager } from './queues/memory/memory-queue'
import { redisQueueManager } from './queues/redis/redis-queue'

const queueMode = system.get(SystemProp.QUEUE_MODE)
export const flowQueue = queueMode === QueueMode.MEMORY ? inMemoryQueueManager : redisQueueManager

