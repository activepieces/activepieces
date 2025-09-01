import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowContextToFlowVersion1756299230217 implements MigrationInterface {
    name = 'AddFlowContextToFlowVersion1756299230217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD "flowContext" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN "flowContext"
        `)
    }

}
