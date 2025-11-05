import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProjectIdFromPieceMetadata1762177958823 implements MigrationInterface {
    name = 'RemoveProjectIdFromPieceMetadata1762177958823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_ai_usage_project_created"
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
            ADD "platformId" character varying NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("platformId", "created", "projectId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_ai_usage_project_created"
        `);
        await queryRunner.query(`
            ALTER TABLE "ai_usage" DROP COLUMN "platformId"
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("created", "projectId")
        `);
    }

}
