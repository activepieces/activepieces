import { QueryRunner } from 'typeorm'
import { BackgroundMigration } from './background-migration'
import { BACKGROUND_MIGRATIONS_TABLE } from './background-migration-runner'

export const migrationHelpers = {
    assertBackgroundMigrationComplete,
    createIndexConcurrently,
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

    const uniqueClause = unique ? 'UNIQUE ' : ''
    const whereClause = where ? ` WHERE ${where}` : ''
    await queryRunner.query(
        `CREATE ${uniqueClause}INDEX CONCURRENTLY "${name}" ON "${table}" (${columns})${whereClause}`,
    )
}
