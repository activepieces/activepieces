import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCreatedToFlowVersionFlowIdIdxPostgres1752511716028 implements MigrationInterface {
    name = 'AddCreatedToFlowVersionFlowIdIdxPostgres1752511716028'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id_created_desc" ON "flow_version" ("flowId", "created" DESC)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_version_flow_id_created_desc"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId")
        `)
    }

}
