import { AppSystemProp, QueueMode, system } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import { memoryConsumer } from '../memory/memory-consumer'
import { redisConsumer } from '../redis/redis-consumer'

const systemMode = system.getOrThrow(AppSystemProp.QUEUE_MODE)
export const flowConsumer = (log: FastifyBaseLogger) => systemMode == QueueMode.MEMORY ? memoryConsumer : redisConsumer(log)