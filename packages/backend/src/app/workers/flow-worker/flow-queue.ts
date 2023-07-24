import { inMemoryQueueManager } from './queues/memory/memory-queue'
import { QueueMode, queueMode } from './queues/queue'
import { redisQueueManager } from './queues/redis/redis-queue'

export const flowQueue = queueMode === QueueMode.MEMORY ? inMemoryQueueManager : redisQueueManager

