import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()
const FLOW_VERSION_TABLE = 'flow_version'
const PIECE_TYPE = 'PIECE'

export class addVersionToPieceSteps1677521257188 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('addVersionToPieceSteps1677521257188, started')

        const flowVersions = await queryRunner.query('SELECT * FROM flow_version')

        for (const flowVersion of flowVersions) {
            let step = flowVersion.trigger
            let update = false

            while (step) {
                if (step.type === PIECE_TYPE) {
                    step.settings.pieceVersion = '0.0.0'
                    update = true
                }

                step = step.nextAction
            }

            if (update) {
                await queryRunner.query(
                    `UPDATE ${FLOW_VERSION_TABLE} SET trigger = $1 WHERE id = $2`,
                    [flowVersion.trigger, flowVersion.id],
                )
            }
        }

        log.info('addVersionToPieceSteps1677521257188, finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('addVersionToPieceSteps1677521257188, started')

        const flowVersions = await queryRunner.query('SELECT * FROM flow_version')

        for (const flowVersion of flowVersions) {
            let step = flowVersion.trigger
            let update = false

            while (step) {
                if (step.type === PIECE_TYPE) {
                    delete step.settings.pieceVersion
                    update = true
                }

                step = step.nextAction
            }

            if (update) {
                await queryRunner.query(
                    `UPDATE ${FLOW_VERSION_TABLE} SET trigger = $1 WHERE id = $2`,
                    [flowVersion.trigger, flowVersion.id],
                )
            }
        }

        log.info('addVersionToPieceSteps1677521257188, finished')
    }
}
