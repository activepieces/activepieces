import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFanInToWaitpoint1818000000000 implements Migration {
    name = 'AddFanInToWaitpoint1818000000000'
    breaking = false
    release = '0.86.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD "isFanIn" boolean NOT NULL DEFAULT false
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD "expectedChildren" integer
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD "failedToDispatch" integer NOT NULL DEFAULT 0
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "waitpoint" DROP COLUMN "failedToDispatch"
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint" DROP COLUMN "expectedChildren"
        `)
        await queryRunner.query(`
            ALTER TABLE "waitpoint" DROP COLUMN "isFanIn"
        `)
    }
}
