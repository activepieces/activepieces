import { FlowVersion } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../../helper/logger'

type Step = {
    type: string
    settings: {
        inputUiInfo?: Record<string, unknown>
    }
    onFailureAction?: Step
    onSuccessAction?: Step
    nextAction?: Step
}

const FLOW_VERSION_TABLE = 'flow_version'

// Legacy flow versions have no inputUiInfo, so we should add it
export class AddInputUiInfo1681107443963 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('AddInputUiInfo1681107443963, started')

        let count = 0
        const flowVersionRepo = queryRunner.connection.getRepository(FLOW_VERSION_TABLE)
        const flowVersions = await queryRunner.query('SELECT * FROM flow_version')

        for (const flowVersion of flowVersions) {
            const steps = getAllSteps(flowVersion as FlowVersion)
            let changed = false
            for (const step of steps) {
                if (step.type === 'PIECE_TRIGGER' || step.type === 'PIECE') {
                    if (!step.settings.inputUiInfo) {
                        step.settings.inputUiInfo = {}
                        changed = true
                    }
                }
            }
            if (changed) {
                count++
                await flowVersionRepo.update(flowVersion.id, flowVersion)
            }
        }
        logger.info('AddInputUiInfo1681107443963, finished flows ' + count)
    }

    public async down(): Promise<void> {
        logger.info('no rolling back AddInputUiInfo1681107443963')
    }
}

function traverseFlowInternal(step: Step | undefined): Step[] {
    const steps: Step[] = []
    while (step !== undefined && step !== null) {
        steps.push(step)
        if (step.type === 'BRANCH') {
            steps.push(...traverseFlowInternal(step.onFailureAction))
            steps.push(...traverseFlowInternal(step.onSuccessAction))
        }
        step = step.nextAction
    }
    return steps
}

function getAllSteps(flowVersion: FlowVersion): Step[] {
    return traverseFlowInternal(flowVersion.trigger)
}
