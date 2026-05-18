import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class FlowRunPauseMetadata1683552928243 implements MigrationInterface {
    name = 'FlowRunPauseMetadata1683552928243'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "flow_run" ADD "pauseMetadata" jsonb')

        log.info('[FlowRunPauseMetadata1683552928243] up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "flow_run" DROP COLUMN "pauseMetadata"',
        )

        log.info('[FlowRunPauseMetadata1683552928243] down')
    }
}
