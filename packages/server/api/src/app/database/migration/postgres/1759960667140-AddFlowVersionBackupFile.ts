import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowVersionBackupFile1759960667140 implements MigrationInterface {
    name = 'AddFlowVersionBackupFile1759960667140'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD "backupFileId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeBillingCycle" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD CONSTRAINT "fk_flow_version_backup_file" FOREIGN KEY ("backupFileId") REFERENCES "file"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP CONSTRAINT "fk_flow_version_backup_file"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "stripeBillingCycle"
            SET DEFAULT 'monthly'
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN "backupFileId"
        `)
    }

}
