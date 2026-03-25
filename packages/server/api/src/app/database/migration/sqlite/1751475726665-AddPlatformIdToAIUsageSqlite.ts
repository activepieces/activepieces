import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlatformIdToAIUsageSqlite1751475726665 implements MigrationInterface {
    name = 'AddPlatformIdToAIUsageSqlite1751475726665'

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                CONSTRAINT "fk_ai_usage_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
                    "projectId"
                )
            SELECT "id",
                "created",
                "updated",
                "provider",
                "model",
                "cost",
                "projectId"
            FROM "temporary_ai_usage"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_ai_usage"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("projectId", "created")
        `)
    }

}
