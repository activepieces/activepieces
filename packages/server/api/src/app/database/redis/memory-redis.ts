import Redis from 'ioredis'
import { RedisMemoryServer } from 'redis-memory-server'
import { system } from '../../helper/system/system'

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
    system.globalLogger().info('Creating Redis Memory Server')
    redisMemoryServer = new RedisMemoryServer()
    return redisMemoryServer
}
