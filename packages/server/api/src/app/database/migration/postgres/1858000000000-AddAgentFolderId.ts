import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAgentFolderId1858000000000 implements Migration {
    name = 'AddAgentFolderId1858000000000'
    breaking = false
    release = '0.92.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD COLUMN IF NOT EXISTS "folderId" character varying(21)
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_agent_folder_id" ON "agent" ("folderId")
        `)
        await queryRunner.query(`
            ALTER TABLE "agent"
            ADD CONSTRAINT "fk_agent_folder_id"
            FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE SET NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "agent" DROP CONSTRAINT IF EXISTS "fk_agent_folder_id"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_agent_folder_id"')
        await queryRunner.query('ALTER TABLE "agent" DROP COLUMN IF EXISTS "folderId"')
    }
}
