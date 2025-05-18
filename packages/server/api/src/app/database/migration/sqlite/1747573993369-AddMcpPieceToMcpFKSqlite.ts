import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMcpPieceToMcpFKSqlite1747573993369 implements MigrationInterface {
    name = 'AddMcpPieceToMcpFKSqlite1747573993369'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                "status" varchar NOT NULL DEFAULT ('ENABLED'),
                CONSTRAINT "uq_mcp_piece_connection_id" UNIQUE ("connectionId"),
                CONSTRAINT "fk_mcp_piece_connection_id" FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_mcp_piece_mcp_id" FOREIGN KEY ("mcpId") REFERENCES "mcp" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
    }

}
