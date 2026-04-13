import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import Redis from 'ioredis'
import { redisConnections } from '../database/redis-connections'

let redisClientSubscriber: Redis | null = null
let redisClientPublisher: Redis | null = null
const mutexLock = new Mutex()

const redisFactory = redisConnections.create

export const pubsub = {
    async subscribe(
        channel: string,
        listener: (message: string) => void,
    ): Promise<void> {
        const subscriber = await getRedisClientSubscriber()
        await subscriber.subscribe(channel)
        subscriber.on('message', (_channel, message) => {
            if (_channel === channel) {
                listener(message)
            }
        })
    },
    async publish(channel: string, message: string): Promise<void> {
        const publisher = await getRedisClientPublisher()
        await publisher.publish(channel, message)
    },
    async unsubscribe(channel: string): Promise<void> {
        const subscriber = await getRedisClientSubscriber()
        await subscriber.unsubscribe(channel)
    },
    async close(): Promise<void> {
        if (!isNil(redisClientSubscriber)) {
            await redisClientSubscriber.quit()
            redisClientSubscriber = null
        }
        if (!isNil(redisClientPublisher)) {
            await redisClientPublisher.quit()
            redisClientPublisher = null
        }
    },
}

async function getRedisClientSubscriber(): Promise<Redis> {
    if (!isNil(redisClientSubscriber)) {
        return redisClientSubscriber
    }

    return mutexLock.runExclusive(async () => {
        if (!isNil(redisClientSubscriber)) {
            return redisClientSubscriber
        }
        redisClientSubscriber = await redisFactory()
        return redisClientSubscriber
    })
}

async function getRedisClientPublisher(): Promise<Redis> {
    if (!isNil(redisClientPublisher)) {
        return redisClientPublisher
    }

    return mutexLock.runExclusive(async () => {
        if (!isNil(redisClientPublisher)) {
            return redisClientPublisher
        }
        redisClientPublisher = await redisFactory()
        return redisClientPublisher
    })
}
