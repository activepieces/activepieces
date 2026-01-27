import { isNil } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import Redis from 'ioredis'

let redisClientSubscriber: Redis | null = null
let redisClientPublisher: Redis | null = null
const mutexLock = new Mutex()

export const pubsubFactory = (redisFactory: () => Promise<Redis>) => ({
    async subscribe(
        channel: string,
        listener: (message: string) => void,
    ): Promise<void> {
        const redisClientSubscriber = await getRedisClientSubscriber(redisFactory)
        await redisClientSubscriber.subscribe(channel)
        redisClientSubscriber.on('message', (_channel, message) => {
            if (_channel === channel) {
                listener(message)
            }
        })
    },
    async publish(channel: string, message: string): Promise<void> {
        const redisClientPublisher = await getRedisClientPublisher(redisFactory)
        await redisClientPublisher.publish(channel, message)
    },
    async unsubscribe(channel: string): Promise<void> {
        const redisClientSubscriber = await getRedisClientSubscriber(redisFactory)
        await redisClientSubscriber.unsubscribe(channel)
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
})

async function getRedisClientSubscriber(redisFactory: () => Promise<Redis>): Promise<Redis> {
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

async function getRedisClientPublisher(redisFactory: () => Promise<Redis>): Promise<Redis> {
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

