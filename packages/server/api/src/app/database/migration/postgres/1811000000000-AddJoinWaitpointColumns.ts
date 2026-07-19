import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddJoinWaitpointColumns1811000000000 implements Migration {
    name = 'AddJoinWaitpointColumns1811000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD "expectedCount" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "waitpoint" DROP COLUMN "expectedCount"
        `)
    }
}
