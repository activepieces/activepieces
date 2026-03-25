import { MigrationInterface, QueryRunner } from 'typeorm'

export class AppConnectionsSetNullSqlite1730627777709 implements MigrationInterface {
    name = 'AppConnectionsSetNullSqlite1730627777709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_owner_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_id_and_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_app_connection" (
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
                CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_app_connection"(
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
            SELECT "id",
                "created",
                "updated",
                "name",
                "pieceName",
                "projectId",
                "value",
                "type",
                "status",
                "ownerId"
            FROM "app_connection"
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
            CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_owner_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_id_and_name"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_app_connection" (
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
                CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_app_connection_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_app_connection"(
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
            SELECT "id",
                "created",
                "updated",
                "name",
                "pieceName",
                "projectId",
                "value",
                "type",
                "status",
                "ownerId"
            FROM "app_connection"
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
            CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_id_and_name"
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
            SELECT "id",
                "created",
                "updated",
                "name",
                "pieceName",
                "projectId",
                "value",
                "type",
                "status",
                "ownerId"
            FROM "temporary_app_connection"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_app_connection"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_id_and_name"
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
                CONSTRAINT "fk_app_connection_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
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
            SELECT "id",
                "created",
                "updated",
                "name",
                "pieceName",
                "projectId",
                "value",
                "type",
                "status",
                "ownerId"
            FROM "temporary_app_connection"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_app_connection"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
    }

}
