import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddTeamsBotInstallation1778753444131 implements Migration {
    name = 'AddTeamsBotInstallation1778753444131'
    breaking = false
    release = '0.83.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "teams_bot_installation" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "tenantId" character varying(255) NOT NULL,
                "teamsTeamId" character varying(255) NOT NULL,
                "serviceUrl" character varying(512) NOT NULL,
                CONSTRAINT "UQ_teams_bot_installation_tenant_team" UNIQUE ("tenantId", "teamsTeamId"),
                CONSTRAINT "PK_teams_bot_installation" PRIMARY KEY ("id")
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "teams_bot_installation"')
    }
}
