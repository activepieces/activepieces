import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPlatformModelTier1859000000000 implements Migration {
    name = 'AddPlatformModelTier1859000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "platform_model_tier" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "name" character varying NOT NULL,
                "emoji" character varying NOT NULL,
                "description" character varying,
                "position" integer NOT NULL DEFAULT 0,
                "entries" jsonb NOT NULL,
                "isDefault" boolean NOT NULL DEFAULT false,
                "isFast" boolean NOT NULL DEFAULT false,
                "thinkingBudget" integer,
                "deleted" TIMESTAMP WITH TIME ZONE,
                "replacedBy" character varying(21),
                CONSTRAINT "PK_platform_model_tier" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_platform_model_tier_platform_id" ON "platform_model_tier" ("platformId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_model_tier_platform_name_live" ON "platform_model_tier" ("platformId", "name") WHERE "deleted" IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_model_tier_platform_default" ON "platform_model_tier" ("platformId") WHERE "isDefault" = true AND "deleted" IS NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_model_tier_platform_fast" ON "platform_model_tier" ("platformId") WHERE "isFast" = true AND "deleted" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_model_tier"
            ADD CONSTRAINT "fk_platform_model_tier_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "aiSpecificModelsVisible" boolean NOT NULL DEFAULT true
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_conversation"
            ADD "modelTierId" character varying(21)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_conversation" DROP COLUMN "modelTierId"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "aiSpecificModelsVisible"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_model_tier" DROP CONSTRAINT "fk_platform_model_tier_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_platform_model_tier_platform_fast"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_platform_model_tier_platform_default"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_platform_model_tier_platform_name_live"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_platform_model_tier_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "platform_model_tier"
        `)
    }
}
