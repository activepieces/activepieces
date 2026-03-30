import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPieceStepsVersionsBackupsToFlowVersion1774500000000 implements MigrationInterface {
    name = 'AddPieceStepsVersionsBackupsToFlowVersion1774500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD COLUMN IF NOT EXISTS "pieceStepsVersionsBackups" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN IF EXISTS "pieceStepsVersionsBackups"
        `)
    }
}
