import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddThemeColorsToPlatform1781206955649 implements Migration {
    name = 'AddThemeColorsToPlatform1781206955649'
    breaking = false
    release = '0.85.2'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "themeColors" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "themeColors"
        `)
    }
}
