import { redisConnections } from './redis'
import { distributedLockFactory } from './redis/distributed-lock-factory'
import { distributedStoreFactory } from './redis/distributed-store-factory'

export { redisConnections }
export const distributedLock = distributedLockFactory(redisConnections.create)
export const distributedStore = distributedStoreFactory(redisConnections.useExisting)
