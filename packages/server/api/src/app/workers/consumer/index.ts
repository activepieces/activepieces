import { AppSystemProp } from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'
import { QueueMode, system } from '../../helper/system/system'
import { redisConsumer } from '../redis/redis-consumer'
import { ConsumerManager } from './types'

const systemMode = system.getOrThrow(AppSystemProp.QUEUE_MODE)
const emptyConsumer: ConsumerManager = ({
    async init(): Promise<void> {
        // no-op
    },
    async close(): Promise<void> {
        // no-op
    },
    async run(): Promise<void> {
        // no-op
    },
})
export const flowConsumer = (log: FastifyBaseLogger) => systemMode == QueueMode.MEMORY ? emptyConsumer : redisConsumer(log)

