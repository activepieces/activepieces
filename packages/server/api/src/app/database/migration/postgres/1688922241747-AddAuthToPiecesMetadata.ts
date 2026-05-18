import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddAuthToPiecesMetadata1688922241747
implements MigrationInterface {
    name = 'AddAuthToPiecesMetadata1688922241747'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('AddAuthToPiecesMetadata1688922241747 is Running')
        await queryRunner.query('ALTER TABLE "piece_metadata" ADD "auth" jsonb')
        log.info('AddAuthToPiecesMetadata1688922241747 is Finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "piece_metadata" DROP COLUMN "auth"')
    }
}
