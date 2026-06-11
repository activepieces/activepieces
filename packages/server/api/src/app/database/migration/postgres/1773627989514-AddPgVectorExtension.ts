import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddPgVectorExtension1773627989514 implements MigrationInterface {
    name = 'AddPgVectorExtension1773627989514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddPgVectorExtension1773627989514] up')

        const alreadyInstalled = await queryRunner.query(`
            SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS installed
        `)
        if (alreadyInstalled[0]?.installed) {
            log.info('[AddPgVectorExtension1773627989514] pgvector already installed — skipping CREATE EXTENSION')
            return
        }

        const extensionAvailable = await queryRunner.query(`
            SELECT COUNT(*) as count FROM pg_available_extensions WHERE name = 'vector'
        `)
        if (Number(extensionAvailable[0]?.count) === 0) {
            log.warn('[Migration] pgvector extension is not available — knowledge base vector search will not work. Install pgvector on your PostgreSQL server to enable this feature.')
            return
        }

        // CREATE EXTENSION can fail with "permission denied" on managed/locked-down Postgres
        // where the app user lacks extension-creation privileges. Under
        // migrationsTransactionMode: 'each' a thrown error poisons the migration's transaction,
        // which also rolls back the migrations-table record — so the migration would re-run and
        // fail on every boot. A SAVEPOINT lets us roll back just the failed statement and still
        // commit the migration as applied, leaving the feature disabled rather than blocking startup.
        await queryRunner.query('SAVEPOINT create_vector_extension')
        try {
            await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "vector"')
            await queryRunner.query('RELEASE SAVEPOINT create_vector_extension')
            log.info('[AddPgVectorExtension1773627989514] pgvector extension created')
        }
        catch {
            await queryRunner.query('ROLLBACK TO SAVEPOINT create_vector_extension')
            log.warn('[Migration] Could not create the pgvector extension (likely insufficient privileges). Knowledge base vector search will be disabled. Ask your database administrator to run `CREATE EXTENSION vector;` in the Activepieces database, then restart. This migration is marked as applied and will not retry.')
        }

        log.info('[AddPgVectorExtension1773627989514] done')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddPgVectorExtension1773627989514] down')
        await queryRunner.query(`
            DROP EXTENSION IF EXISTS "vector"
        `)
        log.info('[AddPgVectorExtension1773627989514] done')
    }
}
