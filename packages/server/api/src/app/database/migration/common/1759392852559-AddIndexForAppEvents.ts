import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexForAppEvents1759392852559 implements MigrationInterface {
    name = 'AddIndexForAppEvents1759392852559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_app_event_appName_identifier_event" ON "app_event_routing" ("appName", "identifierValue", "event")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_event_appName_identifier_event"
        `)
    }

}
