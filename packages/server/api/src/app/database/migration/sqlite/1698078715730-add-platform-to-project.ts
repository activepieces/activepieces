import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class AddPlatformToProject1698078715730 implements MigrationInterface {
    name = 'AddPlatformToProject1698078715730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "notifyStatus" varchar NOT NULL,
                "type" varchar NOT NULL DEFAULT ('STANDALONE'),
                "platformId" varchar(21),
                CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_project"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "displayName",
                    "notifyStatus"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "displayName",
                "notifyStatus"
            FROM "project"
        `)
        await queryRunner.query(`
            DROP TABLE "project"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_project"
                RENAME TO "project"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `)

        logger.info('AddPlatformToProject1698078715730 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
                RENAME TO "temporary_project"
        `)
        await queryRunner.query(`
            CREATE TABLE "project" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "ownerId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "notifyStatus" varchar NOT NULL,
                CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "project"(
                    "id",
                    "created",
                    "updated",
                    "ownerId",
                    "displayName",
                    "notifyStatus"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "displayName",
                "notifyStatus"
            FROM "temporary_project"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_project"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `)

        logger.info('AddPlatformToProject1698078715730 down')
    }
}
