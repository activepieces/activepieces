import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../../helper/logger'

export class AddPieceTypeAndPackageTypeToFlowTemplate1696245170062 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const templates = await queryRunner.query('SELECT * FROM flow_template')
        for (const template of templates) {
            const updated = traverseAndUpdateSubFlow(
                addPackageTypeAndPieceTypeToPieceStepSettings,
                template.template.trigger,
            )
            if (updated) {
                const stringifiedTrigger = JSON.stringify(template.template.trigger)
                await queryRunner.query(`
                    UPDATE flow_version
                        SET trigger = '${stringifiedTrigger}'
                        WHERE id = '${template.id}
                `)
            }
        }
        logger.info('AddPieceTypeAndPackageTypeToFlowTemplate1696245170062: up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const templates = await queryRunner.query('SELECT * FROM flow_template')
        for (const template of templates) {
            const updated = traverseAndUpdateSubFlow(
                removePackageTypeAndPieceTypeFromPieceStepSettings,
                template.template.trigger,
            )
            if (updated) {
                const stringifiedTrigger = JSON.stringify(template.template.trigger)
                await queryRunner.query(`
                    UPDATE flow_version
                        SET trigger = '${stringifiedTrigger}'
                        WHERE id = '${template.id}
                `)
            }
        }
        logger.info('AddPieceTypeAndPackageTypeToFlowTemplate1696245170062: down')
    }
}

const traverseAndUpdateSubFlow = (updater: (s: PieceStep) => void, root?: Step): boolean => {
    if (!root) {
        return false
    }

    let updated = false

    switch (root.type) {
        case 'BRANCH':
            updated = traverseAndUpdateSubFlow(updater, root.onSuccessAction) || updated
            updated = traverseAndUpdateSubFlow(updater, root.onFailureAction) || updated
            break
        case 'LOOP_ON_ITEMS':
            updated = traverseAndUpdateSubFlow(updater, root.firstLoopAction) || updated
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

const addPackageTypeAndPieceTypeToPieceStepSettings = (pieceStep: PieceStep): void => {
    pieceStep.settings.packageType = 'REGISTRY'
    pieceStep.settings.pieceType = 'OFFICIAL'
}

const removePackageTypeAndPieceTypeFromPieceStepSettings = (pieceStep: PieceStep): void => {
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

type Step =
    | BranchStep
    | LoopOnItemsStep
    | GenericStep
    | PieceStep
