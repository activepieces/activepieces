import { MigrationInterface, QueryRunner } from 'typeorm'

export class SeperateTriggerFromFlowsSqlite1754358230010 implements MigrationInterface {
    name = 'SeperateTriggerFromFlowsSqlite1754358230010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "trigger" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
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
            CREATE UNIQUE INDEX "IDX_4dca296d76b8094e00758480c7" ON "trigger" ("projectId", "flowId", "simulate")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_3b34c13cddb1ca1fffec7e9a82" ON "trigger" ("flowId", "simulate")
        `)
        await insertScheduleFromFlowsMigration(queryRunner)
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
            DROP INDEX "IDX_4dca296d76b8094e00758480c7"
        `)
        await queryRunner.query(`
            DROP INDEX "IDX_3b34c13cddb1ca1fffec7e9a82"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_trigger" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "flowId" varchar NOT NULL,
                "flowVersionId" varchar NOT NULL,
                "handshakeConfiguration" text,
                "projectId" varchar NOT NULL,
                "type" varchar NOT NULL,
                "schedule" text,
                "pieceName" varchar NOT NULL,
                "pieceVersion" varchar NOT NULL,
                "simulate" boolean NOT NULL,
                CONSTRAINT "FK_fa9abec1f54b7aecadbbc01ea25" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_07f4cfe174cec5caa4430e7b614" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_trigger"(
                    "id",
                    "created",
                    "updated",
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
                "flowId",
                "flowVersionId",
                "handshakeConfiguration",
                "projectId",
                "type",
                "schedule",
                "pieceName",
                "pieceVersion",
                "simulate"
            FROM "trigger"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_trigger"
                RENAME TO "trigger"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4dca296d76b8094e00758480c7" ON "trigger" ("projectId", "flowId", "simulate")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_3b34c13cddb1ca1fffec7e9a82" ON "trigger" ("flowId", "simulate")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "IDX_3b34c13cddb1ca1fffec7e9a82"
        `)
        await queryRunner.query(`
            DROP INDEX "IDX_4dca296d76b8094e00758480c7"
        `)
        await queryRunner.query(`
            ALTER TABLE "trigger"
                RENAME TO "temporary_trigger"
        `)
        await queryRunner.query(`
            CREATE TABLE "trigger" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
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
            INSERT INTO "trigger"(
                    "id",
                    "created",
                    "updated",
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
                "flowId",
                "flowVersionId",
                "handshakeConfiguration",
                "projectId",
                "type",
                "schedule",
                "pieceName",
                "pieceVersion",
                "simulate"
            FROM "temporary_trigger"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_trigger"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_3b34c13cddb1ca1fffec7e9a82" ON "trigger" ("flowId", "simulate")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_4dca296d76b8094e00758480c7" ON "trigger" ("projectId", "flowId", "simulate")
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
            DROP INDEX "IDX_3b34c13cddb1ca1fffec7e9a82"
        `)
        await queryRunner.query(`
            DROP INDEX "IDX_4dca296d76b8094e00758480c7"
        `)
        await queryRunner.query(`
            DROP TABLE "trigger"
        `)
    }

}

export async function insertScheduleFromFlowsMigration(queryRunner: QueryRunner) {

    const flowIds: { id: string }[]  = await queryRunner.query(`
        SELECT "id" FROM "flow" where "status" = 'ENABLED'
    `)
    for (let i = 0; i < flowIds.length; i += 1000) {
        const flowIdsChunk: string[] = flowIds.slice(i, i + 1000).map((flowId) => flowId.id)
        const flowIdsChunkPromises = flowIdsChunk.map((flowId) => migrateSingleFlow(queryRunner, flowId))
        await Promise.all(flowIdsChunkPromises)
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
        throw new Error(`Flow not found for id ${flowId}`)
    }

    // Fetch flow version
    const flowVersionQuery = `SELECT * FROM "flow_version" WHERE "id" = ${param(1)}`
    const flowVersion = await queryRunner.query(flowVersionQuery, [flowRow.publishedVersionId])
    const flowVersionRow = flowVersion[0] || (flowVersion.records && flowVersion.records[0])
    if (!flowVersionRow) {
        throw new Error(`Flow version not found for id ${flowRow.publishedVersionId}`)
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
            INSERT INTO "trigger" (
                "id", "flowId", "flowVersionId", "handshakeConfiguration", "projectId", "type", "schedule", "pieceName", "pieceVersion", "simulate"
            )
            VALUES (${param(1)}, ${param(2)}, ${param(3)}, ${param(4)}, ${param(5)}, ${param(6)}, ${param(7)}, ${param(8)}, ${param(9)}, ${param(10)})
            ON CONFLICT("flowId", "simulate") DO UPDATE SET
                "id" = excluded."id",
                "flowVersionId" = excluded."flowVersionId",
                "handshakeConfiguration" = excluded."handshakeConfiguration",
                "projectId" = excluded."projectId",
                "type" = excluded."type",
                "schedule" = excluded."schedule",
                "pieceName" = excluded."pieceName",
                "pieceVersion" = excluded."pieceVersion"
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
            INSERT INTO "trigger" (
                "id", "flowId", "flowVersionId", "handshakeConfiguration", "projectId", "type", "schedule", "pieceName", "pieceVersion", "simulate"
            )
            VALUES (${param(1)}, ${param(2)}, ${param(3)}, ${param(4)}, ${param(5)}, ${param(6)}, ${param(7)}, ${param(8)}, ${param(9)}, ${param(10)})
            ON CONFLICT("flowId", "simulate") DO UPDATE SET
                "id" = excluded."id",
                "flowVersionId" = excluded."flowVersionId",
                "handshakeConfiguration" = excluded."handshakeConfiguration",
                "projectId" = excluded."projectId",
                "type" = excluded."type",
                "schedule" = excluded."schedule",
                "pieceName" = excluded."pieceName",
                "pieceVersion" = excluded."pieceVersion"
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