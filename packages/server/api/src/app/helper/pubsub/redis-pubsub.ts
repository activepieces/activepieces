import { Redis } from 'ioredis'

export const redisPubSub = (
    redisClientSubscriber: Redis,
    redisClientPublisher: Redis,
) => {
    return {
        async subscribe(
            channel: string,
            listener: (channel: string, message: string) => void,
        ): Promise<void> {
            await redisClientSubscriber.subscribe(channel)
            redisClientSubscriber.on('message', listener)
        },
        async publish(channel: string, message: string): Promise<void> {
            await redisClientPublisher.publish(channel, message)
        },
        async unsubscribe(channel: string): Promise<void> {
            await redisClientSubscriber.unsubscribe(channel)
        },
    }
}
