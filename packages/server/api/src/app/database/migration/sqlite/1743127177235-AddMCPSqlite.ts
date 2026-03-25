import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMCPSqlite1743127177235 implements MigrationInterface {
    name = 'AddMCPSqlite1743127177235'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar(21) NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `)
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
                "mcpId" varchar(21),
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
            SELECT "id",
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
            CREATE INDEX "idx_app_connection_platform_id" ON "app_connection" ("platformId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_project_ids_and_external_id" ON "app_connection" ("projectIds", "externalId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_owner_id" ON "app_connection" ("ownerId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_app_connection_mcp_id" ON "app_connection" ("mcpId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_owner_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_project_ids_and_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_app_connection_platform_id"
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
            INSERT INTO "app_connection"(
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
            SELECT "id",
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
            FROM "temporary_app_connection"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_app_connection"
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
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp"
        `)
    }

}
