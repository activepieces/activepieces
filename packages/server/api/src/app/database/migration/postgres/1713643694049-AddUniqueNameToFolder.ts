import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddUniqueNameToFolder1713643694049 implements MigrationInterface {
    name = 'AddUniqueNameToFolder1713643694049'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info({ name: this.name }, 'Up')
        await queryRunner.query(`
            DELETE FROM "folder"
            WHERE ("projectId", LOWER("displayName")) IN (
            SELECT "projectId", LOWER("displayName")
            FROM "folder"
            GROUP BY "projectId", LOWER("displayName")
            HAVING COUNT(*) > 1
            )
        `)
        await queryRunner.query(`
            DROP INDEX "idx_folder_project_id"
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_folder_project_id_display_name" ON "folder" ("projectId", "displayName")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_folder_project_id_display_name"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_folder_project_id" ON "folder" ("projectId")
        `)
    }

}
