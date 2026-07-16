import { isNil } from '@activepieces/core-utils'
import { Mutex } from 'async-mutex'
import Redis from 'ioredis'
import { redisConnections } from '../database/redis-connections'

let redisClientSubscriber: Redis | null = null
let redisClientPublisher: Redis | null = null
const mutexLock = new Mutex()
const channelListeners = new Map<string, Set<(message: string) => void>>()

const redisFactory = redisConnections.create

export const pubsub = {
    async subscribe(
        channel: string,
        listener: (message: string) => void,
    ): Promise<void> {
        const subscriber = await getRedisClientSubscriber()
        const existing = channelListeners.get(channel)
        if (!isNil(existing)) {
            existing.add(listener)
            return
        }
        channelListeners.set(channel, new Set([listener]))
        await subscriber.subscribe(channel)
    },
    async publish(channel: string, message: string): Promise<void> {
        const publisher = await getRedisClientPublisher()
        await publisher.publish(channel, message)
    },
    async unsubscribe(channel: string, listener?: (message: string) => void): Promise<void> {
        const listeners = channelListeners.get(channel)
        if (isNil(listeners)) {
            return
        }
        if (!isNil(listener)) {
            listeners.delete(listener)
            if (listeners.size > 0) {
                return
            }
        }
        channelListeners.delete(channel)
        const subscriber = await getRedisClientSubscriber()
        await subscriber.unsubscribe(channel)
    },
    async close(): Promise<void> {
        channelListeners.clear()
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

// Register the message dispatcher once here, not per subscribe call — that is what stops listeners
// from leaking. It fans each channel's message out to the listener set that subscribe/unsubscribe own.
async function getRedisClientSubscriber(): Promise<Redis> {
    if (!isNil(redisClientSubscriber)) {
        return redisClientSubscriber
    }

    return mutexLock.runExclusive(async () => {
        if (!isNil(redisClientSubscriber)) {
            return redisClientSubscriber
        }
        const connection = await redisFactory()
        connection.on('message', (channel: string, message: string) => {
            const listeners = channelListeners.get(channel)
            if (isNil(listeners)) {
                return
            }
            for (const listener of [...listeners]) {
                listener(message)
            }
        })
        redisClientSubscriber = connection
        return connection
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
