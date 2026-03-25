import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPinnedPieces1729776414647 implements MigrationInterface {
    name = 'AddPinnedPieces1729776414647'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "pinnedPieces" character varying array
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET "pinnedPieces" = '{}'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "pinnedPieces" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "pinnedPieces"
        `)
    }

}
