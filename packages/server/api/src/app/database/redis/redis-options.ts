import { RedisOptions } from 'ioredis'

const TCP_KEEP_ALIVE_MS = 5_000
const SOCKET_TIMEOUT_MS = 30_000

export const baseRedisOptions: Partial<RedisOptions> = {
    maxRetriesPerRequest: null,
    keepAlive: TCP_KEEP_ALIVE_MS,
    socketTimeout: SOCKET_TIMEOUT_MS,
}
