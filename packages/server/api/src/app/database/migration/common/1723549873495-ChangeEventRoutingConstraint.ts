import { MigrationInterface, QueryRunner } from 'typeorm'

export class ChangeEventRoutingConstraint1723549873495 implements MigrationInterface {
    name = 'ChangeEventRoutingConstraint1723549873495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_event_project_id_appName_identifier_value_event"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_event_flow_id_project_id_appName_identifier_value_event" ON "app_event_routing" (
                "appName",
                "projectId",
                "flowId",
                "identifierValue",
                "event"
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_app_event_flow_id_project_id_appName_identifier_value_event"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_app_event_project_id_appName_identifier_value_event" ON "app_event_routing" (
                "appName",
                "projectId",
                "identifierValue",
                "event"
            )
        `)
    }

}
