import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveDefaultLocaleFromPlatform1749733527371 implements MigrationInterface {
    name = 'RemoveDefaultLocaleFromPlatform1749733527371'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "defaultLocale"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "defaultLocale" character varying
        `)
    }

}
