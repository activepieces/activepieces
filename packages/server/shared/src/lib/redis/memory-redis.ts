import Redis from 'ioredis'
import { RedisMemoryServer } from 'redis-memory-server'

let redisMemoryServer: RedisMemoryServer | null = null

export async function createMemoryRedisConnection(): Promise<Redis> {
    const memoryServer = getOrCreateRedisMemoryServer()
    const host = await memoryServer.getHost()
    const port = await memoryServer.getPort()
    const client = new Redis({
        maxRetriesPerRequest: null,
        host,
        port,
    })
    return client
}

function getOrCreateRedisMemoryServer(): RedisMemoryServer {
    if (redisMemoryServer) {
        return redisMemoryServer
    }
    redisMemoryServer = new RedisMemoryServer()
    return redisMemoryServer
}
