import { MigrationInterface, QueryRunner } from 'typeorm'

export class SetNotNullOnPlatform1709505632771 implements MigrationInterface {
    name = 'SetNotNullOnPlatform1709505632771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ALTER COLUMN "platformId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ALTER COLUMN "platformId" DROP NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
        `)
    }

}
