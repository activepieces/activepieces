import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../../helper/logger'

const FLOW_VERSION_TABLE = 'flow_version'
const PIECE_TYPE = 'PIECE'

export class addVersionToPieceSteps1677521257188 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('addVersionToPieceSteps1677521257188, started')

        const flowVersionRepo = queryRunner.connection.getRepository(FLOW_VERSION_TABLE)
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
                await flowVersionRepo.update(flowVersion.id, flowVersion)
            }
        }

        logger.info('addVersionToPieceSteps1677521257188, finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info('addVersionToPieceSteps1677521257188, started')

        const flowVersionRepo = queryRunner.connection.getRepository(FLOW_VERSION_TABLE)
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
                await flowVersionRepo.update(flowVersion.id, flowVersion)
            }
        }

        logger.info('addVersionToPieceSteps1677521257188, finished')
    }

}
