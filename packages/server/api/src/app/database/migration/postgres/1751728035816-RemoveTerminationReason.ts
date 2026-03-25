import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveTerminationReason1751728035816 implements MigrationInterface {
    name = 'RemoveTerminationReason1751728035816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE flow_run
            SET status = 'SUCCEEDED'
            WHERE status = 'STOPPED'
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "terminationReason"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "terminationReason" character varying
        `)
    }

}
