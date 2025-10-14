import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTriggerNameToTriggerSourceSqlite1757018637559 implements MigrationInterface {
    name = 'AddTriggerNameToTriggerSourceSqlite1757018637559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_trigger_flow_id_simulate"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_project_id_flow_id_simulate"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_trigger_source" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted" datetime,
                "flowId" varchar NOT NULL,
                "flowVersionId" varchar NOT NULL,
                "handshakeConfiguration" text,
                "projectId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "schedule" text,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "simulate" boolean NOT NULL,
                "triggerName" varchar NOT NULL,
                CONSTRAINT "FK_5f28d74a4fdaf3fc91e6a0e7450" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_3d3024c914f2fbf4f9e25029816" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_trigger_source"(
                    "id",
                    "created",
                    "updated",
                    "deleted",
                    "flowId",
                    "flowVersionId",
                    "handshakeConfiguration",
                    "projectId",
                    "type",
                    "schedule",
                    "pieceName",
                    "pieceVersion",
                    "simulate",
                    "triggerName"
                )
            SELECT "id",
                "created",
                "updated",
                "deleted",
                "flowId",
                "flowVersionId",
                "handshakeConfiguration",
                "projectId",
                "type",
                "schedule",
                "pieceName",
                "pieceVersion",
                "simulate",
                COALESCE(
                    (SELECT json_extract(fv.trigger, '$.settings.triggerName')
                     FROM "flow_version" fv
                     WHERE fv.id = "trigger_source"."flowVersionId"),
                    'trigger'
                ) as "triggerName"
            FROM "trigger_source"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger_source"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_trigger_source"
                RENAME TO "trigger_source"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_flow_id_simulate" ON "trigger_source" ("flowId", "simulate")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_project_id_flow_id_simulate" ON "trigger_source" ("projectId", "flowId", "simulate")
            WHERE deleted IS NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_trigger_project_id_flow_id_simulate"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_flow_id_simulate"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_source"
                RENAME TO "temporary_trigger_source"
        `)
        await queryRunner.query(`
            CREATE TABLE "trigger_source" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted" datetime,
                "flowId" varchar NOT NULL,
                "flowVersionId" varchar NOT NULL,
                "handshakeConfiguration" text,
                "projectId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "schedule" text,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "simulate" boolean NOT NULL,
                CONSTRAINT "FK_5f28d74a4fdaf3fc91e6a0e7450" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_3d3024c914f2fbf4f9e25029816" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "trigger_source"(
                    "id",
                    "created",
                    "updated",
                    "deleted",
                    "flowId",
                    "flowVersionId",
                    "handshakeConfiguration",
                    "projectId",
                    "type",
                    "schedule",
                    "pieceName",
                    "pieceVersion",
                    "simulate"
                )
            SELECT "id",
                "created",
                "updated",
                "deleted",
                "flowId",
                "flowVersionId",
                "handshakeConfiguration",
                "projectId",
                "type",
                "schedule",
                "pieceName",
                "pieceVersion",
                "simulate"
            FROM "temporary_trigger_source"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_trigger_source"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_project_id_flow_id_simulate" ON "trigger_source" ("projectId", "flowId", "simulate")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_flow_id_simulate" ON "trigger_source" ("flowId", "simulate")
            WHERE deleted IS NULL
        `)
    }

}
