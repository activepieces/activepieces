import { createRedisClient } from '../../database/redis-connection'
import { QueueMode, SystemProp, system } from 'server-shared'
import { memoryPubSub } from './memory-pubsub'
import { redisPubSub } from './redis-pubsub'

const queueMode = system.getOrThrow<QueueMode>(SystemProp.QUEUE_MODE)

export const pubSub =
  queueMode === QueueMode.MEMORY
      ? memoryPubSub
      : redisPubSub(createRedisClient(), createRedisClient())
