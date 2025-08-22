import { ActivepiecesError, ErrorCode } from "@activepieces/shared"
import { getRedisConnection } from "../../../database/redis-connection"
import { MachineRouting } from "./type"

const MACHINE_CONNECTIONS_PREFIX = 'machine:connections:'
const MACHINE_LIST_KEY = 'machine:list'

const redisConnection = getRedisConnection

export const distributedRouting: MachineRouting = {
    onHeartbeat: async (request) => {
        await redisConnection().setnx(`${MACHINE_CONNECTIONS_PREFIX}${request.workerId}`, request.sandboxUsed)
        await redisConnection().sadd(MACHINE_LIST_KEY, request.workerId)
    },
    acquire: async () => {
        const luaScript = `
            local machineListKey = KEYS[1]
            local connectionPrefix = ARGV[1]
            
            -- Get all available machines
            local machines = redis.call('SMEMBERS', machineListKey)
            
            if #machines == 0 then
                return nil
            end
            
            -- Find machine with least connections
            local minConnections = math.huge
            local selectedMachine = nil
            
            for i = 1, #machines do
                local connectionKey = connectionPrefix .. machines[i]
                local connections = tonumber(redis.call('GET', connectionKey) or '0')
                
                if connections < minConnections then
                    minConnections = connections
                    selectedMachine = machines[i]
                end
            end
            
            -- Increment connection count for selected machine
            if selectedMachine then
                local connectionKey = connectionPrefix .. selectedMachine
                redis.call('INCR', connectionKey)
                return selectedMachine
            end
            
            return nil
        `
        
        const selectedMachine = await redisConnection().eval(
            luaScript,
            1,
            MACHINE_LIST_KEY,
            MACHINE_CONNECTIONS_PREFIX
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
        const connectionKey = `${MACHINE_CONNECTIONS_PREFIX}${workerId}`
        await redisConnection().decr(connectionKey)
    },
    onDisconnect: async (request) => {
        await redisConnection().srem(MACHINE_LIST_KEY, request.workerId)
        await redisConnection().del(`${MACHINE_CONNECTIONS_PREFIX}${request.workerId}`)
    }
}