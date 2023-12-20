import { createRedisClient } from '../../database/redis-connection'
import { QueueMode, system } from '../system/system'
import { SystemProp } from '../system/system-prop'
import { memoryPubSub } from './memory-pubsub'
import { redisPubSub } from './redis-pubsub'

const queueMode = system.getOrThrow<QueueMode>(SystemProp.QUEUE_MODE)

export const pubSub = queueMode === QueueMode.MEMORY ? memoryPubSub : redisPubSub(createRedisClient(), createRedisClient())