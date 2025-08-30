import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { MachineRouting } from './type'

const machines = new Set<string>()

export const simpleRouting: MachineRouting = {
    onHeartbeat: async (request) => {
        machines.add(request.workerId)
    },
    acquire: async () => {
        if (machines.size === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.MACHINE_NOT_AVAILABLE,
                params: {
                    resourceType: 'machine',
                },
            })
        }
        
        const machineArray = Array.from(machines)
        const lastMachine = machineArray[machineArray.length - 1]
        
        return lastMachine
    },
    release: async () => {
        // No-op for simple routing
    },
    onDisconnect: async (request) => {
        machines.delete(request.workerId)
    },
}
