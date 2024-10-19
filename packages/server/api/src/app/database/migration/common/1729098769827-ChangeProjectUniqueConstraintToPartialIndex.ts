import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeProjectUniqueConstraintToPartialIndex1729098769827 implements MigrationInterface {
    name = 'ChangeProjectUniqueConstraintToPartialIndex1729098769827'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({ name: this.name }, 'Up')
        await queryRunner.query(`
          DROP INDEX "idx_project_platform_id_external_id";
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id"
            ON "project" ("platformId", "externalId")
            WHERE "deleted" IS NULL;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'down')
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id";
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id"
            ON "project" ("platformId", "externalId");
        `)

    }
}
