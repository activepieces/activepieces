import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPremiumPiecesColumnPostgres1717370717678 implements MigrationInterface {
    name = 'AddPremiumPiecesColumnPostgres1717370717678'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "premiumPieces" character varying array
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET "premiumPieces" = '{}'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "premiumPieces" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "premiumPieces"
        `)
    }

}
