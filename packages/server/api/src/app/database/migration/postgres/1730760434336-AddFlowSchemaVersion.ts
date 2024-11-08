import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowSchemaVersion1730760434336 implements MigrationInterface {
    name = 'AddFlowSchemaVersion1730760434336'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD "schemaVersion" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN "schemaVersion"
        `)
    }

}
