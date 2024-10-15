import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLicenseKeyIntoPlatform1728827704109 implements MigrationInterface {
    name = 'AddLicenseKeyIntoPlatform1728827704109'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "licenseKey" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "licenseKey"
        `)
    }

}
