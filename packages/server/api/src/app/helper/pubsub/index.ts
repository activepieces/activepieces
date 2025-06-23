import { AppSystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { createRedisClient } from '../../database/redis-connection'
import { QueueMode, system } from '../system/system'
import { memoryPubSub } from './memory-pubsub'
import { redisPubSub } from './redis-pubsub'

const queueMode = system.getOrThrow<QueueMode>(AppSystemProp.QUEUE_MODE)

let _pubsub: typeof memoryPubSub | null = null

export const pubsub = () => {
    if (!isNil(_pubsub)) {
        return _pubsub
    }

    _pubsub = queueMode === QueueMode.MEMORY
        ? memoryPubSub
        : redisPubSub(createRedisClient(), createRedisClient())

    return _pubsub
}