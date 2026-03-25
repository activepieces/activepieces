import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class ChangeExternalIdsForTables1747346473001 implements MigrationInterface {
    name = 'ChangeExternalIdsForTables1747346473001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "table" SET "externalId" = "id"
        `)

        const flowVersionIds = await queryRunner.query(
            'SELECT id FROM "flow_version" WHERE CAST("trigger" AS TEXT) LIKE \'%@activepieces/piece-tables%\'',
        )
        log.info(
            'ChangeExternalIdsForTables1747346473001: found ' +
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
                const trigger = typeof flowVersion[0].trigger === 'string' ? JSON.parse(flowVersion[0].trigger) : flowVersion[0].trigger
                const updated = traverseAndUpdateSubFlow(
                    updateVersionOfTablesStep,
                    trigger,
                )
                if (updated) {
                    await queryRunner.connection.getRepository('flow_version').update(flowVersion[0].id, { trigger: updated })
                }
            }
            updatedFlows++
            if (updatedFlows % 100 === 0) {
                log.info(
                    'ChangeExternalIdsForTables1747346473001: ' +
            updatedFlows +
            ' flows updated',
                )
            }
        }

        log.info('ChangeExternalIdsForTables1747346473001: up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const flowVersionIds = await queryRunner.query(
            'SELECT id FROM "flow_version" WHERE CAST("trigger" AS TEXT) LIKE \'%@activepieces/piece-tables%\'',
        )
        log.info(
            'ChangeExternalIdsForTables1747346473001 down: found ' +
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
                const trigger = typeof flowVersion[0].trigger === 'string' ? JSON.parse(flowVersion[0].trigger) : flowVersion[0].trigger
                const updated = traverseAndUpdateSubFlow(
                    downgradeVersionOfTablesStep,
                    trigger,
                )
                if (updated) {
                    await queryRunner.connection.getRepository('flow_version').update(flowVersion[0].id, { trigger: updated })
                }
            }
            updatedFlows++
            if (updatedFlows % 100 === 0) {
                log.info(
                    'ChangeExternalIdsForTables1747346473001 down: ' +
            updatedFlows +
            ' flows updated',
                )
            }
        }

        log.info('ChangeExternalIdsForTables1747346473001: down')
    }

}

const traverseAndUpdateSubFlow = (
    updater: (s: Step) => Step,
    root: Step | undefined,
): Step | undefined => {
    if (!root) {
        return undefined
    }

    const clonedRoot = updater(root)

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
): Step => {
    if ((step.type === 'PIECE' || step.type === 'PIECE_TRIGGER') && (step as PieceStep).settings.pieceName === '@activepieces/piece-tables') {
        (step as PieceStep).settings.pieceVersion = '0.1.0'
    }
    return step
}

const downgradeVersionOfTablesStep = (
    step: Step,
): Step => {
    if ((step.type === 'PIECE' || step.type === 'PIECE_TRIGGER') && (step as PieceStep).settings.pieceName === '@activepieces/piece-tables') {
        (step as PieceStep).settings.pieceVersion = '0.0.6'
    }
    return step
}

type StepType =
    | 'CODE'
    | 'EMPTY'
    | 'LOOP_ON_ITEMS'
    | 'PIECE'
    | 'PIECE_TRIGGER'
    | 'ROUTER'

type BaseStep<T extends StepType> = {
    type: T
    nextAction?: Step
}


type RouterStep = BaseStep<'ROUTER'> & {
    children: (Step | null)[]
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

type GenericStep = BaseStep<'CODE' | 'EMPTY'>

type Step = LoopOnItemsStep | GenericStep | PieceStep | RouterStep
