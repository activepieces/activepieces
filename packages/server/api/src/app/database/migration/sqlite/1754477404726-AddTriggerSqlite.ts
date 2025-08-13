import { FastifyBaseLogger } from 'fastify'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

export class AddTriggerSqlite1754477404726 implements MigrationInterface {
    name = 'AddTriggerSqlite1754477404726'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                "simulate" boolean NOT NULL
            )
        `)
        await insertScheduleFromFlowsMigration(queryRunner, system.globalLogger())
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_project_id_flow_id_simulate" ON "trigger_source" ("projectId", "flowId", "simulate")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_flow_id_simulate" ON "trigger_source" ("flowId", "simulate")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            CREATE TABLE "trigger_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "payloadFileId" varchar,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "error" varchar,
                "status" varchar NOT NULL,
                "triggerSourceId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "flowId" varchar(21),
                CONSTRAINT "REL_b76b435f583d4e68c892a7fafa" UNIQUE ("payloadFileId")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_created_piece_name_platform_id" ON "trigger_run" ("created", "platformId", "pieceName")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "publishedVersionId" varchar(21),
                "externalId" varchar NOT NULL,
                "metadata" text,
                CONSTRAINT "UQ_15375936ad7b8c5dc3f50783a22" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
                    "publishedVersionId",
                    "externalId",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "folderId",
                "status",
                "publishedVersionId",
                "externalId",
                "metadata"
            FROM "flow"
        `)
        await queryRunner.query(`
            DROP TABLE "flow"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_flow"
                RENAME TO "flow"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_project_id_flow_id_simulate"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_flow_id_simulate"
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
                CONSTRAINT "FK_3d3024c914f2fbf4f9e25029816" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_5f28d74a4fdaf3fc91e6a0e7450" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
            CREATE UNIQUE INDEX "idx_trigger_project_id_flow_id_simulate" ON "trigger_source" ("projectId", "flowId", "simulate")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_flow_id_simulate" ON "trigger_source" ("flowId", "simulate")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_created_piece_name_platform_id"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_trigger_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "payloadFileId" varchar,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "error" varchar,
                "status" varchar NOT NULL,
                "triggerSourceId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "flowId" varchar(21),
                CONSTRAINT "REL_b76b435f583d4e68c892a7fafa" UNIQUE ("payloadFileId"),
                CONSTRAINT "fk_trigger_run_trigger_source_id" FOREIGN KEY ("triggerSourceId") REFERENCES "trigger_source" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_trigger_run_payload_file_id" FOREIGN KEY ("payloadFileId") REFERENCES "file" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_trigger_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                    CONSTRAINT "fk_trigger_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_trigger_run"(
                    "id",
                    "created",
                    "updated",
                    "payloadFileId",
                    "pieceName",
                    "pieceVersion",
                    "error",
                    "status",
                    "triggerSourceId",
                    "projectId",
                    "platformId",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "payloadFileId",
                "pieceName",
                "pieceVersion",
                "error",
                "status",
                "triggerSourceId",
                "projectId",
                "platformId",
                "flowId"
            FROM "trigger_run"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger_run"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_trigger_run"
                RENAME TO "trigger_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_created_piece_name_platform_id" ON "trigger_run" ("created", "platformId", "pieceName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_created_piece_name_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger_run"
                RENAME TO "temporary_trigger_run"
        `)
        await queryRunner.query(`
            CREATE TABLE "trigger_run" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "payloadFileId" varchar,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "error" varchar,
                "status" varchar NOT NULL,
                "triggerSourceId" varchar(21) NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar(21) NOT NULL,
                "flowId" varchar(21),
                CONSTRAINT "REL_b76b435f583d4e68c892a7fafa" UNIQUE ("payloadFileId")
            )
        `)
        await queryRunner.query(`
            INSERT INTO "trigger_run"(
                    "id",
                    "created",
                    "updated",
                    "payloadFileId",
                    "pieceName",
                    "pieceVersion",
                    "error",
                    "status",
                    "triggerSourceId",
                    "projectId",
                    "platformId",
                    "flowId"
                )
            SELECT "id",
                "created",
                "updated",
                "payloadFileId",
                "pieceName",
                "pieceVersion",
                "error",
                "status",
                "triggerSourceId",
                "projectId",
                "platformId",
                "flowId"
            FROM "temporary_trigger_run"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_trigger_run"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_created_piece_name_platform_id" ON "trigger_run" ("created", "platformId", "pieceName")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_trigger_run_project_id_trigger_source_id_status" ON "trigger_run" ("projectId", "triggerSourceId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_flow_id_simulate"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_project_id_flow_id_simulate"
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
                "simulate" boolean NOT NULL
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
            CREATE UNIQUE INDEX "idx_trigger_flow_id_simulate" ON "trigger_source" ("flowId", "simulate")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_trigger_project_id_flow_id_simulate" ON "trigger_source" ("projectId", "flowId", "simulate")
            WHERE deleted IS NULL
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_folder_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
                RENAME TO "temporary_flow"
        `)
        await queryRunner.query(`
            CREATE TABLE "flow" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "folderId" varchar(21),
                "status" varchar CHECK("status" IN ('ENABLED', 'DISABLED')) NOT NULL DEFAULT ('DISABLED'),
                "schedule" text,
                "publishedVersionId" varchar(21),
                "externalId" varchar NOT NULL,
                "metadata" text,
                "handshakeConfiguration" text,
                CONSTRAINT "UQ_15375936ad7b8c5dc3f50783a22" UNIQUE ("publishedVersionId"),
                CONSTRAINT "fk_flow_published_version" FOREIGN KEY ("publishedVersionId") REFERENCES "flow_version" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
                CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "flow"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "folderId",
                    "status",
                    "publishedVersionId",
                    "externalId",
                    "metadata"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "folderId",
                "status",
                "publishedVersionId",
                "externalId",
                "metadata"
            FROM "temporary_flow"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_created_piece_name_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_run_project_id_trigger_source_id_status"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger_run"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_flow_id_simulate"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_trigger_project_id_flow_id_simulate"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger_source"
        `)
    }

}


export async function insertScheduleFromFlowsMigration(queryRunner: QueryRunner, log: FastifyBaseLogger) {
    const flowIds: { id: string }[] = await queryRunner.query(`
        SELECT "id" FROM "flow" WHERE "status" = 'ENABLED'
    `)
    log.info({
        name: 'insertScheduleFromFlowsMigration',
        message: 'fetched total flows',
        total: flowIds.length,
    })
    for (let i = 0; i < flowIds.length; i += 1000) {
        const flowIdsChunk: string[] = flowIds.slice(i, i + 1000).map((flowId) => flowId.id)
        const flowIdsChunkPromises = flowIdsChunk.map((flowId) => migrateSingleFlow(queryRunner, flowId))
        await Promise.all(flowIdsChunkPromises)
        log.info({
            name: 'insertScheduleFromFlowsMigration',
            migrated: flowIdsChunk.length,
        })
    }
}

async function migrateSingleFlow(queryRunner: QueryRunner, flowId: string) {
    // Detect database type
    const dbType = queryRunner.connection.options.type

    // Use parameterized queries for both sqlite and postgres
    // For sqlite, use '?', for postgres, use '$1', '$2', etc.
    const param = (i: number) => dbType === 'postgres' ? `$${i}` : '?'

    // Fetch flow
    const flowQuery = `SELECT * FROM "flow" WHERE "id" = ${param(1)}`
    const flow = await queryRunner.query(flowQuery, [flowId])
    const flowRow = flow[0] || (flow.records && flow.records[0])
    if (!flowRow) {
        return
    }

    // Fetch flow version
    const flowVersionQuery = `SELECT * FROM "flow_version" WHERE "id" = ${param(1)}`
    const flowVersion = await queryRunner.query(flowVersionQuery, [flowRow.publishedVersionId])
    const flowVersionRow = flowVersion[0] || (flowVersion.records && flowVersion.records[0])
    if (!flowVersionRow) {
        return
    }

    // Parse trigger from flowVersion
    let trigger
    if (typeof flowVersionRow.trigger === 'string') {
        try {
            trigger = JSON.parse(flowVersionRow.trigger)
        }
        catch (e) {
            throw new Error(`Failed to parse trigger JSON for flowVersion ${flowVersionRow.id}`)
        }
    }
    else {
        trigger = flowVersionRow.trigger
    }

    const pieceName = trigger?.settings?.pieceName
    const pieceVersion = trigger?.settings?.pieceVersion
    if (!pieceName || !pieceVersion) {
        return
    }
    const type = flowRow.schedule != null ? 'POLLING' : 'WEBHOOK'

    // Compose insert/upsert query
    let insertQuery: string
    let insertParams: unknown[]

    if (dbType === 'postgres') {
        insertQuery = `
            INSERT INTO "trigger_source" (
                "id", "flowId", "flowVersionId", "handshakeConfiguration", "projectId", "type", "schedule", "pieceName", "pieceVersion", "simulate"
            )
            VALUES (${param(1)}, ${param(2)}, ${param(3)}, ${param(4)}, ${param(5)}, ${param(6)}, ${param(7)}, ${param(8)}, ${param(9)}, ${param(10)})
            ON CONFLICT DO NOTHING
        `
        insertParams = [
            flowRow.id,
            flowRow.id,
            flowRow.publishedVersionId,
            flowRow.handshakeConfiguration,
            flowRow.projectId,
            type,
            flowRow.schedule,
            pieceName,
            pieceVersion,
            false,
        ]
    }
    else {
        // sqlite
        insertQuery = `
            INSERT INTO "trigger_source" (
                "id", "flowId", "flowVersionId", "handshakeConfiguration", "projectId", "type", "schedule", "pieceName", "pieceVersion", "simulate"
            )
            VALUES (${param(1)}, ${param(2)}, ${param(3)}, ${param(4)}, ${param(5)}, ${param(6)}, ${param(7)}, ${param(8)}, ${param(9)}, ${param(10)})
            ON CONFLICT DO NOTHING
        `
        insertParams = [
            flowRow.id,
            flowRow.id,
            flowRow.publishedVersionId,
            flowRow.handshakeConfiguration,
            flowRow.projectId,
            type,
            flowRow.schedule,
            pieceName,
            pieceVersion,
            false,
        ]
    }

    await queryRunner.query(insertQuery, insertParams)
}
