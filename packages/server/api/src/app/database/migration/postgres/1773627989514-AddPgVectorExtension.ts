import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddPgVectorExtension1773627989514 implements MigrationInterface {
    name = 'AddPgVectorExtension1773627989514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddPgVectorExtension1773627989514] up')
        const extensionAvailable = await queryRunner.query(`
            SELECT COUNT(*) as count FROM pg_available_extensions WHERE name = 'vector'
        `)
        if (Number(extensionAvailable[0]?.count) > 0) {
            await queryRunner.query(`
                CREATE EXTENSION IF NOT EXISTS "vector"
            `)
        }
        else {
            log.warn('[Migration] pgvector extension is not available — knowledge base vector search will not work. Install pgvector on your PostgreSQL server to enable this feature.')
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
