import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../../helper/logger'

const FLOW_VERSION_TABLE = 'flow_version'
export class migrateSchedule1679014156667 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('migrateSchedule1679014156667, started')

        let count = 0
        const flowVersionRepo = queryRunner.connection.getRepository(FLOW_VERSION_TABLE)
        const flowVersions = await queryRunner.query('SELECT * FROM flow_version')

        for (const flowVersion of flowVersions) {
            const step = flowVersion.trigger
            if (step.type === 'SCHEDULE') {
                step.type = 'PIECE_TRIGGER'
                step.settings = {
                    input: {
                        cronExpression: step.settings.cronExpression,
                    },
                    triggerName: 'cron_expression',
                    pieceName: 'schedule',
                    pieceVersion: '0.0.2',
                }
                count++
                await flowVersionRepo.update(flowVersion.id, flowVersion)
            }
        }
        logger.info('migrateSchedule1679014156667, finished flows ' + count)

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info('rolling back migrateSchedule1679014156667, started')

        let count = 0
        const flowVersionRepo = queryRunner.connection.getRepository(FLOW_VERSION_TABLE)
        const flowVersions = await queryRunner.query('SELECT * FROM flow_version')

        for (const flowVersion of flowVersions) {
            const step = flowVersion.trigger
            if (step.type === 'PIECE_TRIGGER') {
                if (step.settings.pieceName === 'schedule') {
                    step.type = 'SCHEDULE'
                    step.settings = {
                        cronExpression: step.settings.input.cronExpression,
                    }
                    count++
                    await flowVersionRepo.update(flowVersion.id, flowVersion)
                }
            }
        }
        logger.info('rolling back  migrateSchedule1679014156667, finished flows ' + count)
    }

}
