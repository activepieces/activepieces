import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class ChangeExternalIdsForTables1747312147549 implements MigrationInterface {
    name = 'ChangeExternalIdsForTables1747312147549'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "table" SET "externalId" = "id"
        `)

        const flowVersionIds = await queryRunner.query(
            'SELECT id FROM "flow_version" WHERE CAST("trigger" AS TEXT) LIKE \'%tables-find-record%\'',
        )
        log.info(
            'ChangeExternalIdsForTables1747312147549: found ' +
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
                    updateVersionOfTablesStep,
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
                log.info(
                    'ChangeExternalIdsForTables1747312147549: ' +
            updatedFlows +
            ' flows updated',
                )
            }
        }

        log.info('ChangeExternalIdsForTables1747312147549: up')
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No need to do anything
    }

}

const traverseAndUpdateSubFlow = (
    updater: (s: Step) => void,
    root: Step | undefined,
): Step | undefined => {
    if (!root) {
        return undefined
    }

    const clonedRoot = JSON.parse(JSON.stringify(root))

    switch (clonedRoot.type) {
        case 'ROUTER': {
            const updatedChildren: (Step | null)[] = []
            for (const branch of clonedRoot.children) {
                if (branch) {
                    const branchUpdated = traverseAndUpdateSubFlow(updater, branch)
                    updatedChildren.push(branchUpdated ?? null)
                }
                else {
                    updatedChildren.push(null)
                }
            }
            clonedRoot.children = updatedChildren
            break
        }
        case 'BRANCH':
            clonedRoot.onSuccessAction = clonedRoot.onSuccessAction ?
                traverseAndUpdateSubFlow(updater, clonedRoot.onSuccessAction) : undefined
            clonedRoot.onFailureAction = clonedRoot.onFailureAction ?
                traverseAndUpdateSubFlow(updater, clonedRoot.onFailureAction) : undefined
            updater(clonedRoot)
            break
        case 'LOOP_ON_ITEMS':
            clonedRoot.firstLoopAction = clonedRoot.firstLoopAction ?
                traverseAndUpdateSubFlow(updater, clonedRoot.firstLoopAction) : undefined
            break
        case 'PIECE':
        case 'PIECE_TRIGGER':
            break
        default:
            break
    }

    clonedRoot.nextAction = clonedRoot.nextAction ?
        traverseAndUpdateSubFlow(updater, clonedRoot.nextAction) : undefined

    return clonedRoot
}

const updateVersionOfTablesStep = (
    step: Step,
): void => {
    if (step.type === 'PIECE' || step.type === 'PIECE_TRIGGER') {
        (step as PieceStep).settings.pieceVersion = '0.1.0'
    }
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
    | 'ROUTER'

type BaseStep<T extends StepType> = {
    type: T
    nextAction?: Step
}

type BranchStep = BaseStep<'BRANCH'> & {
    onFailureAction?: Step
    onSuccessAction?: Step
    settings: {
        conditions: unknown[]
    }
}

type RouterStep = BaseStep<'ROUTER'> & {
    children: Step[]
    settings: {
        branches: {
            conditions?: unknown[]
            branchType: 'CONDITION' | 'FALLBACK'
            branchName: string
        }[]
        executionType: 'EXECUTE_FIRST_MATCH'
        inputUiInfo: {
            sampleDataFileId?: string
            sampleDataInputFileId?: string
            lastTestDate?: string
            customizedInputs?: Record<string, unknown>
            currentSelectedData?: unknown
        }
    }
}

type LoopOnItemsStep = BaseStep<'LOOP_ON_ITEMS'> & {
    firstLoopAction?: Step
}

type PieceStep = BaseStep<'PIECE' | 'PIECE_TRIGGER'> & {
    settings: Record<string, unknown>
}

type GenericStep = BaseStep<'CODE' | 'EMPTY' | 'MISSING' | 'WEBHOOK'>

type Step = BranchStep | LoopOnItemsStep | GenericStep | PieceStep | RouterStep
