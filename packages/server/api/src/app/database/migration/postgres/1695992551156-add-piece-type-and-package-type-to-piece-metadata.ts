import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddPieceTypeAndPackageTypeToPieceMetadata1695992551156
implements MigrationInterface {
    name = 'AddPieceTypeAndPackageTypeToPieceMetadata1695992551156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ADD "pieceType" character varying',
        )
        await queryRunner.query(
            'UPDATE "piece_metadata" SET "pieceType" = \'OFFICIAL\' WHERE "projectId" IS NULL',
        )
        await queryRunner.query(
            'UPDATE "piece_metadata" SET "pieceType" = \'CUSTOM\' WHERE "projectId" IS NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ALTER COLUMN "pieceType" SET NOT NULL',
        )

        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ADD "packageType" character varying',
        )
        await queryRunner.query(
            'UPDATE "piece_metadata" SET "packageType" = \'REGISTRY\'',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" ALTER COLUMN "packageType" SET NOT NULL',
        )

        log.info('AddPieceTypeAndPackageTypeToPieceMetadata1695992551156 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" DROP COLUMN "packageType"',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" DROP COLUMN "pieceType"',
        )

        log.info('AddPieceTypeAndPackageTypeToPieceMetadata1695992551156 down')
    }
}
