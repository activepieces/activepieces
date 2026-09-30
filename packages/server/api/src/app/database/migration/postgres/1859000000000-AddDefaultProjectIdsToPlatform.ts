import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddDefaultProjectIdsToPlatform1859000000000 implements Migration {
    name = 'AddDefaultProjectIdsToPlatform1859000000000'
    breaking = false
    release = '0.92.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "defaultProjectIds" character varying array NOT NULL DEFAULT '{}'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "defaultProjectIds"
        `)
    }
}
