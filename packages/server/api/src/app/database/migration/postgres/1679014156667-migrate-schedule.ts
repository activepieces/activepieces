import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()
const FLOW_VERSION_TABLE = 'flow_version'
export class migrateSchedule1679014156667 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('migrateSchedule1679014156667, started')

        let count = 0
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
                await queryRunner.query(
                    `UPDATE ${FLOW_VERSION_TABLE} SET trigger = $1 WHERE id = $2`,
                    [flowVersion.trigger, flowVersion.id],
                )
            }
        }
        log.info('migrateSchedule1679014156667, finished flows ' + count)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('rolling back migrateSchedule1679014156667, started')

        let count = 0
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
                    await queryRunner.query(
                        `UPDATE ${FLOW_VERSION_TABLE} SET trigger = $1 WHERE id = $2`,
                        [flowVersion.trigger, flowVersion.id],
                    )
                }
            }
        }
        log.info(
            'rolling back  migrateSchedule1679014156667, finished flows ' + count,
        )
    }
}
