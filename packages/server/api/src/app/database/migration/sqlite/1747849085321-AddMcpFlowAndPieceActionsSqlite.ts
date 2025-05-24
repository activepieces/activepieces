import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMcpFlowAndPieceActionsSqlite1747849085321 implements MigrationInterface {
    name = 'AddMcpFlowAndPieceActionsSqlite1747849085321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "mcpId" varchar(21) NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_mcp_id" ON "mcp_flow" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_flow_id" ON "mcp_flow" ("flowId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_flow_mcp_id_flow_id" ON "mcp_flow" ("mcpId", "flowId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id_piece_name"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_connection_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_piece" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId"),
                CONSTRAINT "fk_mcp_piece_connection_id" FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_piece"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "mcpId",
                "connectionId"
            FROM "mcp_piece"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_piece"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_piece"
                RENAME TO "mcp_piece"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" ON "mcp_piece" ("mcpId", "pieceName")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar(21) NOT NULL,
                "name" varchar NOT NULL DEFAULT ('MCP Server')
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_mcp"("id", "created", "updated", "projectId", "token")
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token"
            FROM "mcp"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp"
                RENAME TO "mcp"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id_piece_name"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_connection_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_piece" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                "pieceVersion" varchar NOT NULL,
                "actionNames" text NOT NULL,
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId"),
                CONSTRAINT "fk_mcp_piece_connection_id" FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_piece"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "mcpId",
                "connectionId"
            FROM "mcp_piece"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_piece"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_piece"
                RENAME TO "mcp_piece"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" ON "mcp_piece" ("mcpId", "pieceName")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id_piece_name"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_connection_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_piece" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                "pieceVersion" varchar NOT NULL,
                "actionNames" text NOT NULL,
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId"),
                CONSTRAINT "fk_mcp_piece_connection_id" FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_mcp_action_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_piece"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId",
                    "pieceVersion",
                    "actionNames"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "mcpId",
                "connectionId",
                "pieceVersion",
                "actionNames"
            FROM "mcp_piece"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_piece"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_piece"
                RENAME TO "mcp_piece"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" ON "mcp_piece" ("mcpId", "pieceName")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_mcp_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_mcp_id_flow_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_mcp_flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                CONSTRAINT "fk_mcp_flow_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_mcp_flow_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_mcp_flow"("id", "created", "updated", "flowId", "mcpId")
            SELECT "id",
                "created",
                "updated",
                "flowId",
                "mcpId"
            FROM "mcp_flow"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_flow"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_mcp_flow"
                RENAME TO "mcp_flow"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_mcp_id" ON "mcp_flow" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_flow_id" ON "mcp_flow" ("flowId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_flow_mcp_id_flow_id" ON "mcp_flow" ("mcpId", "flowId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_mcp_id_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_mcp_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_flow"
                RENAME TO "temporary_mcp_flow"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar(21) NOT NULL,
                "mcpId" varchar(21) NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "mcp_flow"("id", "created", "updated", "flowId", "mcpId")
            SELECT "id",
                "created",
                "updated",
                "flowId",
                "mcpId"
            FROM "temporary_mcp_flow"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_flow"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_flow_mcp_id_flow_id" ON "mcp_flow" ("mcpId", "flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_flow_id" ON "mcp_flow" ("flowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_flow_mcp_id" ON "mcp_flow" ("mcpId")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_connection_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id_piece_name"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
                RENAME TO "temporary_mcp_piece"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_piece" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                "pieceVersion" varchar NOT NULL,
                "actionNames" text NOT NULL,
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId"),
                CONSTRAINT "fk_mcp_piece_connection_id" FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "mcp_piece"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId",
                    "pieceVersion",
                    "actionNames"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "mcpId",
                "connectionId",
                "pieceVersion",
                "actionNames"
            FROM "temporary_mcp_piece"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_piece"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" ON "mcp_piece" ("mcpId", "pieceName")
        `);
        await queryRunner.query(`
            DROP INDEX "mcp_project_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_connection_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id_piece_name"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
                RENAME TO "temporary_mcp_piece"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp_piece" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "pieceName" varchar NOT NULL,
                "mcpId" varchar(21) NOT NULL,
                "connectionId" varchar(21),
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId"),
                CONSTRAINT "fk_mcp_piece_connection_id" FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "mcp_piece"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "mcpId",
                "connectionId"
            FROM "temporary_mcp_piece"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_piece"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" ON "mcp_piece" ("mcpId", "pieceName")
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp"
                RENAME TO "temporary_mcp"
        `);
        await queryRunner.query(`
            CREATE TABLE "mcp" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "token" varchar(21) NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "mcp"("id", "created", "updated", "projectId", "token")
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "token"
            FROM "temporary_mcp"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_mcp"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_connection_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_piece_mcp_id_piece_name"
        `);
        await queryRunner.query(`
            ALTER TABLE "mcp_piece"
                RENAME TO "temporary_mcp_piece"
        `);
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
                SET NULL ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "mcp_piece"(
                    "id",
                    "created",
                    "updated",
                    "pieceName",
                    "mcpId",
                    "connectionId"
                )
            SELECT "id",
                "created",
                "updated",
                "pieceName",
                "mcpId",
                "connectionId"
            FROM "temporary_mcp_piece"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_mcp_piece"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_mcp_id" ON "mcp_piece" ("mcpId")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_mcp_piece_connection_id" ON "mcp_piece" ("connectionId")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_mcp_piece_mcp_id_piece_name" ON "mcp_piece" ("mcpId", "pieceName")
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_mcp_id_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_flow_id"
        `);
        await queryRunner.query(`
            DROP INDEX "idx_mcp_flow_mcp_id"
        `);
        await queryRunner.query(`
            DROP TABLE "mcp_flow"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "mcp_project_id" ON "mcp" ("projectId")
        `);
    }

}
