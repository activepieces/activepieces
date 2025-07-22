import { MigrationInterface, QueryRunner } from 'typeorm'

export class AIUsagePostgres1750090291551 implements MigrationInterface {
    name = 'AIUsagePostgres1750090291551'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ai_usage" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "provider" character varying NOT NULL,
                "model" character varying NOT NULL,
                "cost" numeric NOT NULL,
                "projectId" character varying(21) NOT NULL,
                CONSTRAINT "PK_3dddab3a15520a9c3eba859195d" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_ai_usage_project_created" ON "ai_usage" ("projectId", "created")
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_usage"
            ADD CONSTRAINT "fk_ai_usage_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_usage" DROP CONSTRAINT "fk_ai_usage_project_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_usage_project_created"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_usage"
        `)
    }

}
