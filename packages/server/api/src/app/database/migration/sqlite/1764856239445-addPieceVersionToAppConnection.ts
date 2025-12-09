import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPieceVersionToAppConnection1764856239445 implements MigrationInterface {
    name = 'AddPieceVersionToAppConnection1764856239445'

    public async up(queryRunner: QueryRunner): Promise<void> {
    
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
                "metadata" text,
                "pieceVersion" varchar NOT NULL,
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
                    "scope",
                    "metadata",
                    "pieceVersion"
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
                "scope",
                "metadata",
                COALESCE(
                    (SELECT "version"
                     FROM "piece_metadata" pm
                     WHERE pm."name" = "app_connection"."pieceName"
                       AND pm."version" GLOB '[0-9]*.[0-9]*.[0-9]*'
                       AND length(pm."version") - length(replace(pm."version", '.', '')) = 2
                     ORDER BY 
                       CAST(substr(pm."version", 1, instr(pm."version" || '.', '.') - 1) AS INTEGER) DESC,
                       CAST(substr(substr(pm."version", instr(pm."version", '.') + 1), 1, instr(substr(pm."version", instr(pm."version", '.') + 1) || '.', '.') - 1) AS INTEGER) DESC,
                       CAST(substr(pm."version", instr(substr(pm."version", instr(pm."version", '.') + 1), '.') + instr(pm."version", '.') + 1) AS INTEGER) DESC
                     LIMIT 1),
                    '0.0.0'
                ) as "pieceVersion"
            FROM "app_connection"
        `)
        await queryRunner.query(`
            DROP TABLE "app_connection"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_app_connection"
                RENAME TO "app_connection"
        `)

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                "metadata" text,
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
                    "scope",
                    "metadata"
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
                "scope",
                "metadata"
            FROM "temporary_app_connection"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_app_connection"
        `)
    }

}
