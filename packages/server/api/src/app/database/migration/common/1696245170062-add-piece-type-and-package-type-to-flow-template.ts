import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'
export class AddPieceTypeAndPackageTypeToFlowTemplate1696245170062
implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        const connection = queryRunner.connection
        const templates = await connection.query('SELECT * FROM flow_template')
        for (const template of templates) {
            const updated = traverseAndUpdateSubFlow(
                addPackageTypeAndPieceTypeToPieceStepSettings,
                template.template.trigger,
            )
            if (updated) {
                await connection.query(
                    'UPDATE flow_template SET template = $1 WHERE id = $2',
                    [template.template, template.id],
                )
            }
        }
        logger.info('AddPieceTypeAndPackageTypeToFlowTemplate1696245170062: up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        const connection = queryRunner.connection
        const templates = await connection.query('SELECT * FROM flow_template')
        for (const template of templates) {
            const updated = traverseAndUpdateSubFlow(
                removePackageTypeAndPieceTypeFromPieceStepSettings,
                template.template.trigger,
            )
            if (updated) {
                await connection.query(
                    'UPDATE flow_template SET template = $1 WHERE id = $2',
                    [template.template, template.id],
                )
            }
        }
        logger.info('AddPieceTypeAndPackageTypeToFlowTemplate1696245170062: down')
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
