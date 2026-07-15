import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFieldPosition1811000000000 implements Migration {
    name = 'AddFieldPosition1811000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD "position" integer NOT NULL DEFAULT '0'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field" DROP COLUMN "position"
        `)
    }
}
