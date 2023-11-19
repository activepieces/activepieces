import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlatformDefaultLanguage1700406308445 implements MigrationInterface {
    name = 'AddPlatformDefaultLanguage1700406308445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "defaultLocale" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "chatbot"
            ALTER COLUMN "visibilityStatus" DROP DEFAULT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "chatbot"
            ALTER COLUMN "visibilityStatus"
            SET DEFAULT 'PRIVATE'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "defaultLocale"
        `)
    }

}
