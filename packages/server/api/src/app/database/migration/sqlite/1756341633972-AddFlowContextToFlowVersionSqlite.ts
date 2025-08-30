import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowContextToFlowVersionSqlite1756341633972 implements MigrationInterface {
    name = 'AddFlowContextToFlowVersionSqlite1756341633972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_schema_version"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id_created_desc"
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
                "agentIds" text NOT NULL,
                "flowContext" varchar,
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
                    "connectionIds",
                    "agentIds"
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
                "connectionIds",
                "agentIds"
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
            CREATE INDEX "idx_flow_version_schema_version" ON "flow_version" ("schemaVersion")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id_created_desc" ON "flow_version" ("flowId", "created")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_schema_version"
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
                "connectionIds" text NOT NULL,
                "agentIds" text NOT NULL,
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
                    "schemaVersion",
                    "connectionIds",
                    "agentIds"
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
                "connectionIds",
                "agentIds"
            FROM "temporary_flow_version"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow_version"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id_created_desc" ON "flow_version" ("flowId", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_schema_version" ON "flow_version" ("schemaVersion")
        `)
    }

}
