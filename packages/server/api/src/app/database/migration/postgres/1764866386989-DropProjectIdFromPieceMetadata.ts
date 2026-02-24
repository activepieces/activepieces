import { MigrationInterface, QueryRunner } from 'typeorm'

export class DropProjectIdFromPieceMetadata1764866386989 implements MigrationInterface {
    name = 'DropProjectIdFromPieceMetadata1764866386989'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN IF EXISTS "projectId"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "projectId" character varying(21)
        `)
    }

}
