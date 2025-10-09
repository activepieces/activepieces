import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { redisConnections } from '../../database/redis'

const MACHINE_SANDBOXES_KEY = 'machine:sandboxes'

export const machineRouting = {
    onHeartbeat: async (request: OnHeartbeatParams) => {
        const redisConnection = await redisConnections.useExisting()
        await redisConnection.zadd(MACHINE_SANDBOXES_KEY, request.freeSandboxes, request.workerId)
    },
    acquire: async (): Promise<string> => {
        const luaScript = `
                local machineKey = KEYS[1]
                
                -- Get machine with highest available sandboxes (highest score)
                local machines = redis.call('ZREVRANGE', machineKey, 0, 0, 'WITHSCORES')
                
                if #machines == 0 then
                    return nil
                end
                
                local selectedMachine = machines[1]
                local availableSandboxes = tonumber(machines[2])
                
                if availableSandboxes <= 0 then
                    return nil
                end
                
                -- Atomically decrement the available sandboxes for this machine
                redis.call('ZINCRBY', machineKey, -1, selectedMachine)
                
                return selectedMachine
            `
        const redisConnection = await redisConnections.useExisting()
        const selectedMachine = await redisConnection.eval(
            luaScript,
            1,
            MACHINE_SANDBOXES_KEY,
        ) as string | null

        if (!selectedMachine) {
            throw new ActivepiecesError({
                code: ErrorCode.MACHINE_NOT_AVAILABLE,
                params: {
                    resourceType: 'machine',
                },
            })
        }
        return selectedMachine
    },
    release: async (workerId: string): Promise<void> => {
        const redisConnection = await redisConnections.useExisting()
        await redisConnection.zincrby(MACHINE_SANDBOXES_KEY, 1, workerId)
    },
    onDisconnect: async (request: OnDisconnectParams): Promise<void> => {
        const redisConnection = await redisConnections.useExisting()
        await redisConnection.zrem(MACHINE_SANDBOXES_KEY, request.workerId)
    },
}

type OnHeartbeatParams = {
    workerId: string
    totalSandboxes: number
    freeSandboxes: number
}

type OnDisconnectParams = {
    workerId: string
}
