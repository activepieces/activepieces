import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFilteredComponentNamesToPlatform1800000000000 implements Migration {
    name = 'AddFilteredComponentNamesToPlatform1800000000000'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN IF NOT EXISTS "filteredActionNames" jsonb NOT NULL DEFAULT '{}'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN IF NOT EXISTS "filteredTriggerNames" jsonb NOT NULL DEFAULT '{}'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "filteredTriggerNames"')
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "filteredActionNames"')
    }
}
