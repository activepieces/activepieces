import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddTeamsBotInstallation1811000000000 implements Migration {
    name = 'AddTeamsBotInstallation1811000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "teams_bot_installation" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "appId" character varying(255) NOT NULL,
                "tenantId" character varying(255) NOT NULL,
                "teamsTeamId" character varying(255) NOT NULL,
                "serviceUrl" character varying(512) NOT NULL,
                CONSTRAINT "UQ_9d4e7cb17346c4840309540b56d" UNIQUE ("appId", "tenantId", "teamsTeamId"),
                CONSTRAINT "PK_teams_bot_installation" PRIMARY KEY ("id")
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "teams_bot_installation"')
    }
}
