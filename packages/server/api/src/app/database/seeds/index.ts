import { devDataSeed } from './dev-seeds'
import { rolesSeed } from './role-seed'

export const databaseSeeds = {
    async run() {
        const seeds = [
            rolesSeed,
            devDataSeed,
        ]
        for (const seed of seeds) {
            await seed.run()
        }
    },
}