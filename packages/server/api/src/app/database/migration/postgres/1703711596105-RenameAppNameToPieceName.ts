import { MigrationInterface, QueryRunner } from 'typeorm'

export class RenameAppNameToPieceName1703711596105
implements MigrationInterface {
    name = 'RenameAppNameToPieceName1703711596105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection"
                RENAME COLUMN "appName" TO "pieceName"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection"
                RENAME COLUMN "pieceName" TO "appName"
        `)
    }
}
