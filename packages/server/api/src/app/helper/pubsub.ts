import Redis from "ioredis"
import { redisConnections } from "../database/redis"
import { Mutex } from "async-mutex"
import { isNil } from "@activepieces/shared"

let redisClientSubscriber: Redis | null = null
let redisClientPublisher: Redis | null = null
let mutexLock = new Mutex()

export const pubsub = {
    async subscribe(
        channel: string,
        listener: (channel: string, message: string) => void,
    ): Promise<void> {
        const redisClientSubscriber = await getRedisClientSubscriber()
        await redisClientSubscriber.subscribe(channel)
        redisClientSubscriber.on('message', listener)
    },
    async publish(channel: string, message: string): Promise<void> {
        const redisClientPublisher = await getRedisClientPublisher()
        await redisClientPublisher.publish(channel, message)
    },
    async unsubscribe(channel: string): Promise<void> {
        const redisClientSubscriber = await getRedisClientSubscriber()
        await redisClientSubscriber.unsubscribe(channel)
    },
}

async function getRedisClientSubscriber(): Promise<Redis> {
    if(!isNil(redisClientSubscriber)) {
        return redisClientSubscriber
    }
    return await mutexLock.runExclusive(async () => {
        if (!redisClientSubscriber) {
            redisClientSubscriber = await redisConnections.createNew()
        }
        return redisClientSubscriber
    })
}

async function getRedisClientPublisher(): Promise<Redis> {
    if(!isNil(redisClientPublisher)) {
        return redisClientPublisher
    }
    return  await mutexLock.runExclusive(async () => {
        if (!redisClientPublisher) {
            redisClientPublisher = await redisConnections.createNew()
        }
        return redisClientPublisher
    })
}