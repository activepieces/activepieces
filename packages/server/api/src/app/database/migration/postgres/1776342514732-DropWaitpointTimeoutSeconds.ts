import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class DropWaitpointTimeoutSeconds1776342514732 implements Migration {
    name = 'DropWaitpointTimeoutSeconds1776342514732'
    breaking = false
    release = '0.82.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "waitpoint" DROP COLUMN "timeoutSeconds"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "waitpoint"
            ADD "timeoutSeconds" integer
        `)
    }

}
