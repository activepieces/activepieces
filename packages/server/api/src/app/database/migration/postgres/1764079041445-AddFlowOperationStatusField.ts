import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowOperationStatusField1764079041445 implements MigrationInterface {
    name = 'AddFlowOperationStatusField1764079041445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "operationStatus" character varying NOT NULL DEFAULT 'NONE'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "operationStatus"
        `)
    }

}
