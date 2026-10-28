import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddIsDefaultToProject1877000000000 implements Migration {
    name = 'AddIsDefaultToProject1877000000000'
    breaking = false
    release = '0.93.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD COLUMN IF NOT EXISTS "isDefault" boolean NOT NULL DEFAULT false
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "chk_project_is_default_team" CHECK ("type" = 'TEAM' OR "isDefault" = false) NOT VALID
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "chk_project_is_default_team"
        `)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN IF EXISTS "isDefault"
        `)
    }
}
