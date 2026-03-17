import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowVersionBackupFile1759964470862 implements MigrationInterface {
    name = 'AddFlowVersionBackupFile1759964470862'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD "backupFiles" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN "backupFiles"
        `)
    }

}
