import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class MigrateConnectionNames1731428722977 implements MigrationInterface {
    name = 'MigrateConnectionNames1731428722977'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'up')
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP CONSTRAINT "fk_app_connection_app_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_id_and_name"
        `)

        await queryRunner.query(`
            ALTER TABLE "app_connection"
            RENAME COLUMN "name" TO "externalId"
        `)

        // Add projectIds and populate it with projectId as the first element
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "projectIds" character varying array
        `)
        await queryRunner.query(`
            UPDATE "app_connection"
            SET "projectIds" = ARRAY["projectId"]
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "projectIds" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "projectId"
        `)

        // Add display name
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "displayName" character varying
        `)
        await queryRunner.query(`
            UPDATE "app_connection"
            SET "displayName" = "externalId"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "displayName" SET NOT NULL
        `)

        // Add platform id
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "platformId" character varying
        `)
        await queryRunner.query(`
            UPDATE "app_connection" ac
            SET "platformId" = p."platformId"
            FROM "project" p
            WHERE ac."projectIds" && ARRAY[p."id"]
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "platformId" SET NOT NULL
        `)

        // Add Not Null Scope
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "scope" character varying
        `)
        await queryRunner.query(`
            UPDATE "app_connection"
            SET "scope" = 'PROJECT'
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "scope" SET NOT NULL
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_project_ids_and_external_id" ON "app_connection" ("projectIds", "externalId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_platform_id" ON "app_connection" ("platformId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'down')
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_ids_and_external_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "scope"
        `)

        // Add projectId column
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD COLUMN "projectId" character varying(21)
        `)
        await queryRunner.query(`
            UPDATE "app_connection"
            SET "projectId" = "projectIds"[1]
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "projectId" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "projectIds"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "displayName"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            RENAME COLUMN "externalId" TO "name"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("name", "projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

}
