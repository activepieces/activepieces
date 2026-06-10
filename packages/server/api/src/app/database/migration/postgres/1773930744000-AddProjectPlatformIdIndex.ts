import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProjectPlatformIdIndex1773930744000 implements MigrationInterface {
    name = 'AddProjectPlatformIdIndex1773930744000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_project_platform_id" ON "project" ("platformId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id"
        `)
    }
}
