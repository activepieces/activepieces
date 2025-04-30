import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddConnectionIdsToFlowVersion1745530653784 implements MigrationInterface {
    name = 'AddConnectionIdsToFlowVersion1745530653784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD "connectionIds" character varying array NOT NULL DEFAULT '{}'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN "connectionIds"
        `)
    }

}
