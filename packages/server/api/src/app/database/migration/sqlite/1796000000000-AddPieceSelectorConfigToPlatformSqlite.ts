import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPieceSelectorConfigToPlatformSqlite1796000000000 implements MigrationInterface {
    name = 'AddPieceSelectorConfigToPlatformSqlite1796000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN "pieceSelectorConfig" text
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "pieceSelectorConfig"
        `)
    }
}
