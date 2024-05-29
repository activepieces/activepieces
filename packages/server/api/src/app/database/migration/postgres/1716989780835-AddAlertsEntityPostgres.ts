import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAlertsEntityPostgres1716989780835 implements MigrationInterface {
    name = 'AddAlertsEntityPostgres1716989780835'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "alert" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "channel" character varying NOT NULL,
                "details" character varying NOT NULL
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "alertsEnabled" boolean NOT NULL
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET "alertsEnabled" = false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "flowIssuesEnabled"
        `)
        await queryRunner.query(`
            DROP TABLE "alert"
        `)
    }

}
