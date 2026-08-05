import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddStatusToProject1820000000000 implements Migration {
    name = 'AddStatusToProject1820000000000'
    breaking = false
    release = '0.86.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "status" character varying NOT NULL DEFAULT 'ACTIVE'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "status"
        `)
    }
}
