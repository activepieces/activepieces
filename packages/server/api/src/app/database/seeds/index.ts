import { devDataSeed } from './dev-seeds'
import { knowledgeBaseSeed } from './knowledge-base-seed'
import { rolesSeed } from './role-seed'

export const databaseSeeds = {
    async run() {
        const seeds = [
            rolesSeed,
            devDataSeed,
            knowledgeBaseSeed,
        ]
        for (const seed of seeds) {
            await seed.run()
        }
    },
}