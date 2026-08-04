import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiModelRoutingTable1819000000000 implements Migration {
    name = 'AddAiModelRoutingTable1819000000000'
    breaking = false
    release = '0.86.4'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ai_model_routing" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "tiers" jsonb NOT NULL,
                CONSTRAINT "PK_ai_model_routing" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_ai_model_routing_platform_id" ON "ai_model_routing" ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_model_routing"
            ADD CONSTRAINT "fk_ai_model_routing_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "ai_model_routing"')
    }
}
