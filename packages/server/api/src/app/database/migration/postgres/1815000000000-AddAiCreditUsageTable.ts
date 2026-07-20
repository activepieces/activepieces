import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiCreditUsageTable1815000000000 implements Migration {
    name = 'AddAiCreditUsageTable1815000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ai_credit_usage" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "projectId" character varying(21) NOT NULL,
                "provider" character varying NOT NULL,
                "model" character varying NOT NULL,
                "day" character varying NOT NULL,
                "credits" double precision NOT NULL,
                CONSTRAINT "pk_ai_credit_usage" PRIMARY KEY ("id"),
                CONSTRAINT "fk_ai_credit_usage_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_ai_credit_usage_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_credit_usage_platform_project_provider_model_day" ON "ai_credit_usage"
            ("platformId", "projectId", "provider", "model", "day")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "ai_credit_usage"')
    }
}
