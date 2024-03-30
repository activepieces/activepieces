import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProjectUsageColumnToPiece1711768296861 implements MigrationInterface {
    name = 'AddProjectUsageColumnToPiece1711768296861'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "projectUsage" integer NOT NULL DEFAULT '0'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "projectUsage"
        `)
    }

}
