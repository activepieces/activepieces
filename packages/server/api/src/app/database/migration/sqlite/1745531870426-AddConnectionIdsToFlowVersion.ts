import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddConnectionIdsToFlowVersion1745531870426 implements MigrationInterface {
    name = 'AddConnectionIdsToFlowVersion1745531870426'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id_piece_name"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_connection_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_piece" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                "status" varchar NOT NULL DEFAULT ('ENABLED'),
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_piece"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "mcpId",
                "connectionId",
                "status"
            FROM "mcp_piece"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_piece"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_piece"
                RENAME TO "mcp_piece"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" ON "mcp_piece" ("mcpId", "pieceName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id_piece_name"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_connection_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_flow_version" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "trigger" text,
                "updatedBy" varchar,
                "valid" boolean NOT NULL,
                "state" varchar NOT NULL,
                "schemaVersion" varchar,
                "connectionIds" text NOT NULL,
                CONSTRAINT "fk_flow_version_flow" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_updated_by_user_flow" FOREIGN KEY ("updatedBy") REFERENCES "user" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_flow_version"(
                    "id",
                    "created",
                    "updated",
                    "flowId",
                    "displayName",
                    "trigger",
                    "updatedBy",
                    "valid",
                    "state",
                    "schemaVersion",
                    "connectionIds"
                )
            SELECT "id",
                "created",
                "updated",
                "flowId",
                "displayName",
                "trigger",
                "updatedBy",
                "valid",
                "state",
                "schemaVersion",
                '[]' as "connectionIds"
            FROM "flow_version"
        `)
        await queryRunner.query(`
            DROP TABLE "flow_version"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_flow_version"
                RENAME TO "flow_version"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_piece_unique_piece_per_mcp" ON "mcp_piece" ("mcpId", "pieceName")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_piece_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_piece_connection_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_piece_unique_piece_per_mcp"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_piece" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                "status" varchar NOT NULL DEFAULT ('ENABLED'),
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId"),
                CONSTRAINT "FK_db16ef3f2b25f33f07aa23fe832" FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_piece"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "mcpId",
                "connectionId",
                "status"
            FROM "mcp_piece"
        `)
        await queryRunner.query(`
            DROP TABLE "mcp_piece"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_piece"
                RENAME TO "mcp_piece"
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_piece_unique_piece_per_mcp" ON "mcp_piece" ("mcpId", "pieceName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_piece_unique_piece_per_mcp"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_piece_connection_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_piece_mcp_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
                RENAME TO "temporary_mcp_piece"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_piece" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                "status" varchar NOT NULL DEFAULT ('ENABLED'),
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_piece"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "mcpId",
                "connectionId",
                "status"
            FROM "temporary_mcp_piece"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_piece"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_piece_unique_piece_per_mcp" ON "mcp_piece" ("mcpId", "pieceName")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `)
        await queryRunner.query(`
            CREATE INDEX "mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_piece_unique_piece_per_mcp"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_piece_connection_id"
        `)
        await queryRunner.query(`
            DROP INDEX "mcp_piece_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version"
                RENAME TO "temporary_flow_version"
        `)
        await queryRunner.query(`
            CREATE TABLE "flow_version" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "displayName" varchar NOT NULL,
                "trigger" text,
                "updatedBy" varchar,
                "valid" boolean NOT NULL,
                "state" varchar NOT NULL,
                "schemaVersion" varchar,
                CONSTRAINT "fk_flow_version_flow" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_updated_by_user_flow" FOREIGN KEY ("updatedBy") REFERENCES "user" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "flow_version"(
                    "id",
                    "created",
                    "updated",
                    "flowId",
                    "displayName",
                    "trigger",
                    "updatedBy",
                    "valid",
                    "state",
                    "schemaVersion"
                )
            SELECT "id",
                "created",
                "updated",
                "flowId",
                "displayName",
                "trigger",
                "updatedBy",
                "valid",
                "state",
                "schemaVersion"
            FROM "temporary_flow_version"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow_version"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" ON "mcp_piece" ("mcpId", "pieceName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_connection_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id_piece_name"
        `)
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
                RENAME TO "temporary_mcp_piece"
        `)
        await queryRunner.query(`
            CREATE TABLE "mcp_piece" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                "status" varchar NOT NULL DEFAULT ('ENABLED'),
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId"),
                CONSTRAINT "fk_mcp_piece_connection_id" FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_mcp_piece_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "mcp_piece"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId",
                    "status"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "mcpId",
                "connectionId",
                "status"
            FROM "temporary_mcp_piece"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_piece"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" ON "mcp_piece" ("mcpId", "pieceName")
        `)
    }

}
