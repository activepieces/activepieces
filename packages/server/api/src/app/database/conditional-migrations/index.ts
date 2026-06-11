import { tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { transaction } from '../../core/db/transaction'
import { databaseConnection } from '../database-connection'
import { enableKnowledgeBaseVector } from './enable-knowledge-base-vector'

const registry: ConditionalMigration[] = [
    enableKnowledgeBaseVector,
]

export const conditionalMigrations = {
    async run({ log }: { log: FastifyBaseLogger }): Promise<void> {
        for (const migration of registry) {
            if (await conditionalMigrations.isApplied(migration.name)) {
                continue
            }
            const { error } = await tryCatch(() => transaction(async (entityManager) => {
                await migration.up(entityManager)
                await entityManager.query(
                    'INSERT INTO migrations ("timestamp", "name") VALUES ($1, $2)',
                    [Date.now(), migration.name],
                )
            }))
            if (error) {
                log.warn(`[ConditionalMigrations] ${migration.name} deferred — will retry on next startup: ${error.message}`)
                continue
            }
            log.info(`[ConditionalMigrations] applied ${migration.name}`)
        }
    },

    async isApplied(name: string): Promise<boolean> {
        const { data } = await tryCatch(() => databaseConnection().query(
            'SELECT EXISTS (SELECT 1 FROM migrations WHERE name = $1) AS applied',
            [name],
        ))
        return data?.[0]?.applied === true
    },
}



export type ConditionalMigration = {
    name: string
    up: (entityManager: EntityManager) => Promise<void>
}
