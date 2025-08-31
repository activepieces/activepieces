import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveAgentTestPromptSqlite1754863757450 implements MigrationInterface {
    name = 'RemoveAgentTestPromptSqlite1754863757450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_agent_projectId_externalId"
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
                "systemPrompt" varchar NOT NULL,
                "projectId" varchar NOT NULL,
                "platformId" varchar NOT NULL,
                "mcpId" varchar NOT NULL,
                "outputType" varchar NOT NULL,
                "outputFields" text NOT NULL,
                "externalId" varchar NOT NULL,
                CONSTRAINT "fk_agent_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_agent_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                "systemPrompt",
                "projectId",
                "platformId",
                "mcpId",
                "outputType",
                "outputFields",
                "externalId"
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
            CREATE UNIQUE INDEX "idx_agent_projectId_externalId" ON "agent" ("projectId", "externalId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_agent_projectId_externalId"
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
                "externalId" varchar NOT NULL,
                CONSTRAINT "fk_agent_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "fk_agent_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
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
                "systemPrompt",
                "projectId",
                "platformId",
                "mcpId",
                "outputType",
                "outputFields",
                "externalId"
            FROM "temporary_agent"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_agent"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_projectId_externalId" ON "agent" ("projectId", "externalId")
        `)
    }

}
