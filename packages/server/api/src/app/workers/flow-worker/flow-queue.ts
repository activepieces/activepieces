import { QueueMode, SystemProp, system } from 'server-shared'
import { inMemoryQueueManager } from './queues/memory/memory-queue'
import { redisQueueManager } from './queues/redis/redis-queue'

const queueMode = system.get(SystemProp.QUEUE_MODE)
export const flowQueue =
  queueMode === QueueMode.MEMORY ? inMemoryQueueManager : redisQueueManager
