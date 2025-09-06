import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { getRedisConnection } from '../../../database/redis-connection'
import { MachineRouting } from './type'

const MACHINE_SANDBOXES_KEY = 'machine:sandboxes'

const redisConnection = getRedisConnection

export const distributedRouting: MachineRouting = {
    onHeartbeat: async (request) => {
        await redisConnection().zadd(MACHINE_SANDBOXES_KEY, request.freeSandboxes, request.workerId)
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

        const selectedMachine = await redisConnection().eval(
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
    release: async (workerId) => {
        await redisConnection().zincrby(MACHINE_SANDBOXES_KEY, 1, workerId)
    },
    onDisconnect: async (request) => {
        await redisConnection().zrem(MACHINE_SANDBOXES_KEY, request.workerId)
    },
}