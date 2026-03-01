import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTerminationReason1698323987669 implements MigrationInterface {
    name = 'AddTerminationReason1698323987669'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "terminationReason" character varying
        `)
        await queryRunner.query(`
        UPDATE "flow_run"
        SET "status" = 'SUCCEEDED',
            "terminationReason" = 'STOPPED_BY_HOOK'
        WHERE "status" = 'STOPPED'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        UPDATE "flow_run"
        SET "status" = 'STOPPED',
            "terminationReason" = null
        WHERE "status" = 'SUCCEEDED' AND "terminationReason" = 'STOPPED_BY_HOOK'
    `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "terminationReason"
        `)
    }
}
