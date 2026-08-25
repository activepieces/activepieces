import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAiToolConfigTable1797000000000 implements Migration {
    name = 'AddAiToolConfigTable1797000000000'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ai_tool_config" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "capability" character varying NOT NULL,
                "provider" character varying NOT NULL,
                "auth" json NOT NULL,
                "config" json,
                "enabled" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_ai_tool_config" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_ai_tool_config_platform_capability" ON "ai_tool_config" ("platformId", "capability")
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_tool_config"
            ADD CONSTRAINT "fk_ai_tool_config_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_tool_config" DROP CONSTRAINT "fk_ai_tool_config_platform_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_ai_tool_config_platform_capability"
        `)
        await queryRunner.query(`
            DROP TABLE "ai_tool_config"
        `)
    }
}
