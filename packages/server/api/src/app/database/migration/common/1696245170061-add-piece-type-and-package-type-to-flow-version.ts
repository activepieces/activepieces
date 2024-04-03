import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class AddPieceTypeAndPackageTypeToFlowVersion1696245170061
implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
    // Execute raw SQL query to fetch IDs of FlowVersion records
        const flowVersionIds = await queryRunner.query(
            'SELECT id FROM flow_version',
        )
        logger.info(
            'AddPieceTypeAndPackageTypeToFlowVersion1696245170061: found ' +
        flowVersionIds.length +
        ' versions',
        )
        let updatedFlows = 0
        for (const { id } of flowVersionIds) {
            // Fetch FlowVersion record by ID
            const flowVersion = await queryRunner.query(
                'SELECT * FROM flow_version WHERE id = $1',
                [id],
            )
            if (flowVersion.length > 0) {
                const updated = traverseAndUpdateSubFlow(
                    addPackageTypeAndPieceTypeToPieceStepSettings,
                    flowVersion[0].trigger,
                )
                if (updated) {
                    await queryRunner.query(
                        'UPDATE flow_version SET trigger = $1 WHERE id = $2',
                        [flowVersion[0].trigger, flowVersion[0].id],
                    )
                }
            }
            updatedFlows++
            if (updatedFlows % 100 === 0) {
                logger.info(
                    'AddPieceTypeAndPackageTypeToFlowVersion1696245170061: ' +
            updatedFlows +
            ' flows updated',
                )
            }
        }

        logger.info('AddPieceTypeAndPackageTypeToFlowVersion1696245170061: up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    // Execute raw SQL query to fetch IDs of FlowVersion records
        const flowVersionIds = await queryRunner.query(
            'SELECT id FROM flow_version',
        )
        for (const { id } of flowVersionIds) {
            // Fetch FlowVersion record by ID
            const flowVersion = await queryRunner.query(
                'SELECT * FROM flow_version WHERE id = $1',
                [id],
            )

            if (flowVersion.length > 0) {
                const updated = traverseAndUpdateSubFlow(
                    removePackageTypeAndPieceTypeFromPieceStepSettings,
                    flowVersion[0].trigger,
                )
                if (updated) {
                    await queryRunner.query(
                        'UPDATE flow_version SET trigger = $1 WHERE id = $2',
                        [flowVersion[0].trigger, flowVersion[0].id],
                    )
                }
            }
        }

        logger.info('AddPieceTypeAndPackageTypeToFlowVersion1696245170061: down')
    }
}

const traverseAndUpdateSubFlow = (
    updater: (s: PieceStep) => void,
    root?: Step,
): boolean => {
    if (!root) {
        return false
    }

    let updated = false

    switch (root.type) {
        case 'BRANCH':
            updated =
        traverseAndUpdateSubFlow(updater, root.onSuccessAction) || updated
            updated =
        traverseAndUpdateSubFlow(updater, root.onFailureAction) || updated
            break
        case 'LOOP_ON_ITEMS':
            updated =
        traverseAndUpdateSubFlow(updater, root.firstLoopAction) || updated
            break
        case 'PIECE':
        case 'PIECE_TRIGGER':
            updater(root)
            updated = true
            break
        default:
            break
    }

    updated = traverseAndUpdateSubFlow(updater, root.nextAction) || updated
    return updated
}

const addPackageTypeAndPieceTypeToPieceStepSettings = (
    pieceStep: PieceStep,
): void => {
    pieceStep.settings.packageType = 'REGISTRY'
    pieceStep.settings.pieceType = 'OFFICIAL'
}

const removePackageTypeAndPieceTypeFromPieceStepSettings = (
    pieceStep: PieceStep,
): void => {
    delete pieceStep.settings.packageType
    delete pieceStep.settings.pieceType
}

type StepType =
  | 'BRANCH'
  | 'CODE'
  | 'EMPTY'
  | 'LOOP_ON_ITEMS'
  | 'MISSING'
  | 'PIECE'
  | 'PIECE_TRIGGER'
  | 'WEBHOOK'

type BaseStep<T extends StepType> = {
    type: T
    nextAction?: Step
}

type BranchStep = BaseStep<'BRANCH'> & {
    onFailureAction?: Step
    onSuccessAction?: Step
}

type LoopOnItemsStep = BaseStep<'LOOP_ON_ITEMS'> & {
    firstLoopAction?: Step
}

type PieceStep = BaseStep<'PIECE' | 'PIECE_TRIGGER'> & {
    settings: {
        packageType?: 'REGISTRY' | 'ARCHIVE'
        pieceType?: 'OFFICIAL' | 'CUSTOM'
    }
}

type GenericStep = BaseStep<'CODE' | 'EMPTY' | 'MISSING' | 'WEBHOOK'>

type Step = BranchStep | LoopOnItemsStep | GenericStep | PieceStep
