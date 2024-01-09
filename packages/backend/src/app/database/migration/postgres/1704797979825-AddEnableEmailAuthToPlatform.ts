import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEnableEmailAuthToPlatform1704797979825 implements MigrationInterface {
    name = 'AddEnableEmailAuthToPlatform1704797979825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "emailAuthEnabled" boolean NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "emailAuthEnabled"
        `)
    }

}
