import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemovePlatformSMTP1764945141702 implements MigrationInterface {
    name = 'RemovePlatformSMTP1764945141702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "smtp"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "smtp" jsonb
        `)
    }

}
