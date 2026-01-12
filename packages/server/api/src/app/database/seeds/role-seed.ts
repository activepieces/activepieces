import { system } from '../../helper/system/system'
import { DataSeed } from './data-seed'

// EE ProjectRoleEntity has been removed - this seed is now a no-op for community edition
export const rolesSeed: DataSeed = {
    run: async () => {
        // Roles seed is an EE feature - skip in community edition
        system.globalLogger().info({ name: 'rolesSeed' }, 'Skipping roles seed - community edition')
    },
}
