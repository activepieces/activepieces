import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddColorToRecordAndCell1812000000000 implements Migration {
    name = 'AddColorToRecordAndCell1812000000000'
    breaking = false
    release = '0.85.5'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "record"
            ADD COLUMN IF NOT EXISTS "color" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "cell"
            ADD COLUMN IF NOT EXISTS "color" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "cell" DROP COLUMN IF EXISTS "color"')
        await queryRunner.query('ALTER TABLE "record" DROP COLUMN IF EXISTS "color"')
    }
}
