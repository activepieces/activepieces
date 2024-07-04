import { QueueMode, system, SystemProp } from '@activepieces/server-shared'
import { memoryConsumer } from '../memory/memory-consumer'
import { redisConsumer } from '../redis/redis-consumer'

const systemMode = system.getOrThrow(SystemProp.QUEUE_MODE)
export const flowConsumer = systemMode == QueueMode.MEMORY ? memoryConsumer : redisConsumer