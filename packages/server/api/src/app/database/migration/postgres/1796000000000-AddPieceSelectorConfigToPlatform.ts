import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPieceSelectorConfigToPlatform1796000000000 implements Migration {
    name = 'AddPieceSelectorConfigToPlatform1796000000000'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "pieceSelectorConfig" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "pieceSelectorConfig"
        `)
    }
}
