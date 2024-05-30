import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAlertsEntitySqlite1717000733019 implements MigrationInterface {
    name = 'AddAlertsEntitySqlite1717000733019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "alert" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "projectId" varchar(21) NOT NULL,
                "channel" varchar NOT NULL,
                "receiver" varchar NOT NULL
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
