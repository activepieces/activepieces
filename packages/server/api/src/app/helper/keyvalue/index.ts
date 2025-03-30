import { AppSystemProp } from '@activepieces/server-shared'
import { createRedisClient } from '../../database/redis-connection'
import { QueueMode, system } from '../system/system'
import { memoryStore } from './memory-store'
import { createRedisStore } from './redis-store'

let _distributedStore: typeof memoryStore | null = null

export const distributedStore = () => {
    if (_distributedStore !== null) {
        return _distributedStore
    }

    _distributedStore = system.getOrThrow<QueueMode>(AppSystemProp.QUEUE_MODE) === QueueMode.REDIS
        ? createRedisStore(createRedisClient())
        : memoryStore

    return _distributedStore
}

