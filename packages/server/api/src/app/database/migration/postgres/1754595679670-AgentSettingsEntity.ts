import { MigrationInterface, QueryRunner } from 'typeorm'

export class AgentSettingsEntity1754595679670 implements MigrationInterface {
    name = 'AgentSettingsEntity1754595679670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "agent_settings" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "agentId" character varying(21) NOT NULL,
                "aiMode" boolean NOT NULL,
                "triggerOnNewRow" boolean NOT NULL,
                "triggerOnFieldUpdate" boolean NOT NULL,
                "allowAgentCreateColumns" boolean NOT NULL,
                "limitColumnEditing" boolean NOT NULL,
                "editableColumns" json NOT NULL,
                CONSTRAINT "REL_6c1096900a00fab05112ab55a9" UNIQUE ("agentId"),
                CONSTRAINT "PK_ffe5afe48bdfd4f8fb00ef1e7e5" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_agent_settings_agent_id" ON "agent_settings" ("agentId")
        `)
        await queryRunner.query(`
            ALTER TABLE "agent_settings"
            ADD CONSTRAINT "fk_agent_settings_agent_id" FOREIGN KEY ("agentId") REFERENCES "agent"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent_settings" DROP CONSTRAINT "fk_agent_settings_agent_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_agent_settings_agent_id"
        `)
        await queryRunner.query(`
            DROP TABLE "agent_settings"
        `)
    }

}
