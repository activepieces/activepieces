import { QueryRunner } from 'typeorm'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { BackgroundMigration } from './background-migration'
import { BACKGROUND_MIGRATIONS_TABLE } from './background-migration-runner'
import { DatabaseType } from './database-type'

export const migrationHelpers = {
    assertBackgroundMigrationComplete,
    createIndexConcurrently,
    dropIndexConcurrently,
}

async function assertBackgroundMigrationComplete({
    queryRunner,
    migration,
}: {
    queryRunner: QueryRunner
    migration: new () => BackgroundMigration
}): Promise<void> {
    const name = new migration().name
    const rows = await queryRunner.query(
        `SELECT 1 FROM "${BACKGROUND_MIGRATIONS_TABLE}" WHERE "name" = $1`,
        [name],
    )
    if (rows.length === 0) {
        throw new Error(
            `Background migration "${name}" has not completed. `
            + `Wait for it to finish (SELECT * FROM ${BACKGROUND_MIGRATIONS_TABLE}), then retry.`,
        )
    }
}

async function createIndexConcurrently({
    queryRunner,
    name,
    table,
    columns,
    where,
    unique = false,
}: {
    queryRunner: QueryRunner
    name: string
    table: string
    columns: string
    where?: string
    unique?: boolean
}): Promise<void> {
    const uniqueClause = unique ? 'UNIQUE ' : ''
    const whereClause = where ? ` WHERE ${where}` : ''

    if (isPGlite()) {
        await queryRunner.query(
            `CREATE ${uniqueClause}INDEX IF NOT EXISTS "${name}" ON "${table}" (${columns})${whereClause}`,
        )
        return
    }

    const rows = await queryRunner.query(
        `SELECT indisvalid FROM pg_index i
         JOIN pg_class c ON c.oid = i.indexrelid
         WHERE c.relname = $1`,
        [name],
    )
    const row = rows[0] as { indisvalid: boolean } | undefined

    if (row?.indisvalid === true) return

    if (row?.indisvalid === false) {
        await queryRunner.query(`REINDEX INDEX CONCURRENTLY "${name}"`)
        return
    }

    await queryRunner.query(
        `CREATE ${uniqueClause}INDEX CONCURRENTLY "${name}" ON "${table}" (${columns})${whereClause}`,
    )
}

async function dropIndexConcurrently({
    queryRunner,
    name,
}: {
    queryRunner: QueryRunner
    name: string
}): Promise<void> {
    const concurrently = isPGlite() ? '' : 'CONCURRENTLY'
    await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "${name}"`)
}

const isPGlite = (): boolean => system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE
