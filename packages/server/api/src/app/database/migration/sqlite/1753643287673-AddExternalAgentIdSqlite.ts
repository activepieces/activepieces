import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExternalAgentIdSqlite1753643287673 implements MigrationInterface {
    name = 'AddExternalAgentIdSqlite1753643287673'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id_created_desc"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_schema_version"
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
                CONSTRAINT "fk_updated_by_user_flow" FOREIGN KEY ("updatedBy") REFERENCES "user" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_version_flow" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        // Insert agentIds as empty array '[]' for all rows
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
                '[]'
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
            CREATE INDEX "idx_flow_version_flow_id_created_desc" ON "flow_version" ("flowId", "created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_schema_version" ON "flow_version" ("schemaVersion")
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_agent" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "profilePictureUrl" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "description" varchar NOT NULL,
                "maxSteps" integer NOT NULL,
                "testPrompt" varchar NOT NULL,
                "systemPrompt" varchar NOT NULL,
                "projectId" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "mcpId" varchar NOT NULL,
                "outputType" varchar NOT NULL,
                "outputFields" text NOT NULL,
                "externalId" varchar NOT NULL,
                CONSTRAINT "FK_7103e2d16e62e3e3dc335307175" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_bb2611fd1fdb5469f50c00eaf31" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_agent"(
                    "id",
                    "created",
                    "updated",
                    "profilePictureUrl",
                    "displayName",
                    "description",
                    "maxSteps",
                    "testPrompt",
                    "systemPrompt",
                    "projectId",
                    "platformId",
                    "mcpId",
                    "outputType",
                    "outputFields",
                    "externalId"
                )
            SELECT "id",
                "created",
                "updated",
                "profilePictureUrl",
                "displayName",
                "description",
                "maxSteps",
                "testPrompt",
                "systemPrompt",
                "projectId",
                "platformId",
                "mcpId",
                "outputType",
                "outputFields",
                "id"
            FROM "agent"
        `)
        await queryRunner.query(`
            DROP TABLE "agent"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_agent"
                RENAME TO "agent"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_ai_usage" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "provider" varchar NOT NULL,
                "model" varchar NOT NULL,
                "cost" decimal NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar NOT NULL,
                "metadata" text NOT NULL,
                CONSTRAINT "fk_ai_usage_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_ai_usage"(
                    "id",
                    "created",
                    "updated",
                    "provider",
                    "model",
                    "cost",
                    "projectId",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "provider",
                "model",
                "cost",
                "projectId",
                "platformId"
            FROM "ai_usage"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_usage"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_ai_usage"
                RENAME TO "ai_usage"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("platformId", "created", "projectId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_projectId_externalId" ON "agent" ("projectId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_agent_projectId_externalId"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
                RENAME TO "temporary_ai_usage"
        `)
        await queryRunner.query(`
            CREATE TABLE "ai_usage" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "provider" varchar NOT NULL,
                "model" varchar NOT NULL,
                "cost" decimal NOT NULL,
                "projectId" varchar(21) NOT NULL,
                "platformId" varchar NOT NULL,
                CONSTRAINT "fk_ai_usage_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "ai_usage"(
                    "id",
                    "created",
                    "updated",
                    "provider",
                    "model",
                    "cost",
                    "projectId",
                    "platformId"
                )
            SELECT "id",
                "created",
                "updated",
                "provider",
                "model",
                "cost",
                "projectId",
                "platformId"
            FROM "temporary_ai_usage"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_usage"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("platformId", "created", "projectId")
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
                RENAME TO "temporary_agent"
        `)
        await queryRunner.query(`
            CREATE TABLE "agent" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "profilePictureUrl" varchar NOT NULL,
                "displayName" varchar NOT NULL,
                "description" varchar NOT NULL,
                "maxSteps" integer NOT NULL,
                "testPrompt" varchar NOT NULL,
                "systemPrompt" varchar NOT NULL,
                "projectId" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "mcpId" varchar NOT NULL,
                "outputType" varchar NOT NULL,
                "outputFields" text NOT NULL,
                CONSTRAINT "FK_7103e2d16e62e3e3dc335307175" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
                CONSTRAINT "FK_bb2611fd1fdb5469f50c00eaf31" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "agent"(
                    "id",
                    "created",
                    "updated",
                    "profilePictureUrl",
                    "displayName",
                    "description",
                    "maxSteps",
                    "testPrompt",
                    "systemPrompt",
                    "projectId",
                    "platformId",
                    "mcpId",
                    "outputType",
                    "outputFields"
                )
            SELECT "id",
                "created",
                "updated",
                "profilePictureUrl",
                "displayName",
                "description",
                "maxSteps",
                "testPrompt",
                "systemPrompt",
                "projectId",
                "platformId",
                "mcpId",
                "outputType",
                "outputFields"
            FROM "temporary_agent"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_agent"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_schema_version"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id_created_desc"
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
                CONSTRAINT "fk_updated_by_user_flow" FOREIGN KEY ("updatedBy") REFERENCES "user" ("id") ON DELETE
                SET NULL ON UPDATE NO ACTION,
                    CONSTRAINT "fk_flow_version_flow" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                "connectionIds"
            FROM "temporary_flow_version"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_flow_version"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_schema_version" ON "flow_version" ("schemaVersion")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id_created_desc" ON "flow_version" ("flowId", "created")
        `)
    }

}
