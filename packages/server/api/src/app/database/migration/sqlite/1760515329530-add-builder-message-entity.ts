import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBuilderMessageEntity1760515329530 implements MigrationInterface {
    name = 'AddBuilderMessageEntity1760515329530'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "builder_message" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "role" varchar CHECK("role" IN ('assistant', 'user', 'tool')) NOT NULL,
                "content" varchar NOT NULL,
                "usage" text
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_builder_message_project_flow" ON "builder_message" ("projectId", "flowId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_builder_message_project_flow"
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_builder_message" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "role" varchar CHECK("role" IN ('assistant', 'user', 'tool')) NOT NULL,
                "content" varchar NOT NULL,
                "usage" text,
                CONSTRAINT "FK_257ee9c3bc160ef16b2af94c334" FOREIGN KEY ("flowId") REFERENCES "flow" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_f34e2ab61f888e97825eba6d477" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_builder_message"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "role",
                    "content",
                    "usage"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "role",
                "content",
                "usage"
            FROM "builder_message"
        `)
        await queryRunner.query(`
            DROP TABLE "builder_message"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_builder_message"
                RENAME TO "builder_message"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_builder_message_project_flow" ON "builder_message" ("projectId", "flowId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_builder_message_project_flow"
        `)
        await queryRunner.query(`
            ALTER TABLE "builder_message"
                RENAME TO "temporary_builder_message"
        `)
        await queryRunner.query(`
            CREATE TABLE "builder_message" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "flowId" varchar(21) NOT NULL,
                "role" varchar CHECK("role" IN ('assistant', 'user', 'tool')) NOT NULL,
                "content" varchar NOT NULL,
                "usage" text
            )
        `)
        await queryRunner.query(`
            INSERT INTO "builder_message"(
                    "id",
                    "created",
                    "updated",
                    "projectId",
                    "flowId",
                    "role",
                    "content",
                    "usage"
                )
            SELECT "id",
                "created",
                "updated",
                "projectId",
                "flowId",
                "role",
                "content",
                "usage"
            FROM "temporary_builder_message"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_builder_message"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_builder_message_project_flow" ON "builder_message" ("projectId", "flowId")
        `)
        await queryRunner.query(`
            DROP INDEX "idx_builder_message_project_flow"
        `)
        await queryRunner.query(`
            DROP TABLE "builder_message"
        `)
    }

}
