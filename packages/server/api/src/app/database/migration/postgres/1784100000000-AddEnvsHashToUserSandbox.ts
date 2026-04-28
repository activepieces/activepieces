import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddEnvsHashToUserSandbox1784100000000 implements Migration {
    name = 'AddEnvsHashToUserSandbox1784100000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_sandbox" ADD COLUMN "envsHash" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_sandbox" DROP COLUMN "envsHash"
        `)
    }
}
