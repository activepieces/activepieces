import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddVersionNameToFlowVersion1794000000000 implements Migration {
    name = 'AddVersionNameToFlowVersion1794000000000'
    breaking = false
    release = '0.84.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Human-readable label the user assigns to each version
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD COLUMN IF NOT EXISTS "versionName" character varying NULL
        `)
        // Tracks which locked version a draft was cloned from (USE_AS_DRAFT)
        // so that publishing can reuse the original locked row.
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD COLUMN IF NOT EXISTS "usedAsDraftFromVersionId" character varying NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN IF EXISTS "versionName"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN IF EXISTS "usedAsDraftFromVersionId"
        `)
    }
}
