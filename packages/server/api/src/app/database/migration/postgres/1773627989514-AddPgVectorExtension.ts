import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPgVectorExtension1773627989514 implements MigrationInterface {
    name = 'AddPgVectorExtension1773627989514'

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`
                CREATE EXTENSION IF NOT EXISTS "vector"
            `)
        }
        catch {
            console.warn('[Migration] pgvector extension is not available — knowledge base vector search will not work. Install pgvector on your PostgreSQL server to enable this feature.')
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP EXTENSION IF EXISTS "vector"
        `)
    }
}
