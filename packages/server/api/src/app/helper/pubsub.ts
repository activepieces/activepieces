import { pubsubFactory } from '@activepieces/server-shared'
import { redisConnections } from '../database/redis-connections'

export const pubsub = pubsubFactory(redisConnections.create)
