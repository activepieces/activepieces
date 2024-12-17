import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddDeletedToProjectSqlite1710248182409 implements MigrationInterface {
    name = 'AddDeletedToProjectSqlite1710248182409'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info({
            name: this.name,
        }, 'up')
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
        `)
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
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                "deleted" datetime,
                CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
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
                    "notifyStatus",
                    "platformId",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "displayName",
                "notifyStatus",
                "platformId",
                "externalId"
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
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `)

        log.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_project_owner_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_project_platform_id_external_id"
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
                "platformId" varchar(21) NOT NULL,
                "externalId" varchar,
                CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
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
                    "notifyStatus",
                    "platformId",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "ownerId",
                "displayName",
                "notifyStatus",
                "platformId",
                "externalId"
            FROM "temporary_project"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_project"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_project_platform_id_external_id" ON "project" ("platformId", "externalId")
        `)

        log.info({ name: this.name }, 'down')
    }

}
