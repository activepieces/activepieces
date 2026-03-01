import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class FixPieceMetadataOrderBug1694367186954
implements MigrationInterface {
    name = 'FixPieceMetadataOrderBug1694367186954'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ALTER COLUMN "auth" TYPE json',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ALTER COLUMN "actions" TYPE json',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ALTER COLUMN "triggers" TYPE json',
        )

        log.info('[FixPieceMetadataOrderBug1694367186954] up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ALTER COLUMN "auth" SET DATA TYPE jsonb USING my_json::jsonb',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ALTER COLUMN "actions" SET DATA TYPE jsonb USING my_json::jsonb',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ALTER COLUMN "triggers" SET DATA TYPE jsonb USING my_json::jsonb',
        )

        log.info('[FixPieceMetadataOrderBug1694367186954] down')
    }
}
