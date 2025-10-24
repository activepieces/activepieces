import { createDistributedStore } from '@activepieces/server-shared'
import { redisConnections } from '../database/redis-connections'

export const distributedStore = createDistributedStore(redisConnections.useExisting)
