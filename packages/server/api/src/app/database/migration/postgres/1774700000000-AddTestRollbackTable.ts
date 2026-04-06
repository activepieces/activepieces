import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddTestRollbackTable1774700000000 implements Migration {
    name = 'AddTestRollbackTable1774700000000'
    breaking = false
    release = '0.81.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE "test_rollback" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), CONSTRAINT "PK_test_rollback" PRIMARY KEY ("id"))')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "test_rollback"')
    }
}
