import { FastifyBaseLogger } from 'fastify'
import { memoryConsumer } from '../memory/memory-consumer'
import { redisConsumer } from '../redis/redis-consumer'
import { AppSystemProp } from '../../helper/system/system-prop'
import { QueueMode, system } from '../../helper/system/system'

const systemMode = system.getOrThrow(AppSystemProp.QUEUE_MODE)
export const flowConsumer = (log: FastifyBaseLogger) => systemMode == QueueMode.MEMORY ? memoryConsumer : redisConsumer(log)