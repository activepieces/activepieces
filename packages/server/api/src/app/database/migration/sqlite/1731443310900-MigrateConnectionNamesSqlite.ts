import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class MigrateConnectionNamesSqlite1731443310900 implements MigrationInterface {
    name = 'MigrateConnectionNamesSqlite1731443310900'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info({
            name: this.name,
        }, 'up')
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_id_and_name"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_owner_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_app_connection" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "value" text NOT NULL,
                "type" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT ('ACTIVE'),
                "ownerId" varchar,
                "displayName" varchar NOT NULL,
                "externalId" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "projectIds" text NOT NULL,
                "scope" varchar NOT NULL,
                CONSTRAINT "fk_app_connection_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_app_connection"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "value",
                    "type",
                    "status",
                    "ownerId",
                    "displayName",
                    "externalId",
                    "platformId",
                    "projectIds",
                    "scope"
                )
            SELECT 
                ac."id",
                ac."created",
                ac."updated",
                ac."pieceName",
                ac."value",
                ac."type",
                ac."status",
                ac."ownerId",
                ac."name" as "displayName",
                ac."name" as "externalId",
                p."platformId",
                ac."projectId" as "projectIds",
                'PROJECT' as "scope"
            FROM "app_connection" ac
            LEFT JOIN "project" p ON ac."projectId" = p."id"
        `)
        await queryRunner.query(`
            DROP TABLE "app_connection"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_app_connection"
                RENAME TO "app_connection"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
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
            DROP INDEX "idx_app_connection_owner_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
                RENAME TO "temporary_app_connection"
        `)
        await queryRunner.query(`
            CREATE TABLE "app_connection" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "pieceName" varchar NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "value" text NOT NULL,
                "type" varchar NOT NULL,
                "status" varchar NOT NULL DEFAULT ('ACTIVE'),
                "ownerId" varchar,
                CONSTRAINT "fk_app_connection_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "app_connection"(
                    "id",
                    "created",
                    "updated",
                    "name",
                    "pieceName",
                    "projectId",
                    "value",
                    "type",
                    "status",
                    "ownerId"
                )
            SELECT 
                "id",
                "created",
                "updated",
                "externalId" as "name",
                "pieceName",
                SUBSTR("projectIds", 3, LENGTH("projectIds") - 4) as "projectId",
                "value",
                "type",
                "status",
                "ownerId"
            FROM "temporary_app_connection"
            WHERE "scope" = 'PROJECT'
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_app_connection"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name")
        `)
    }

}
