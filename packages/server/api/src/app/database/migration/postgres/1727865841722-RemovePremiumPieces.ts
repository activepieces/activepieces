import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemovePremiumPieces1727865841722 implements MigrationInterface {
    name = 'RemovePremiumPieces1727865841722'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "premiumPieces"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "premiumPieces" character varying array NOT NULL
        `)
    }

}
