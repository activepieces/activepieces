/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-case-declarations */
import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class SwitchToRouter1730999337 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const flowVersionIds = await queryRunner.query(
            'SELECT id FROM flow_version WHERE "schemaVersion" IS NULL',
        )
        logger.info(
            'SwitchToRouter1730999337: found ' +
            flowVersionIds.length +
            ' versions',
        )
        let updatedFlows = 0
        for (const { id } of flowVersionIds) {
            const flowVersion = await queryRunner.query(
                'SELECT * FROM flow_version WHERE id = $1',
                [id],
            )
            if (flowVersion.length > 0) {
                const updated = traverseAndUpdateSubFlow(
                    convertBranchToRouter,
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
                    'SwitchToRouter1730999337: ' +
                    updatedFlows +
                    ' flows updated',
                )
            }
        }

        logger.info('SwitchToRouter1730999337: up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error('SwitchToRouter1730999337: down - no rollback supported')
    }
}

const traverseAndUpdateSubFlow = (
    updater: (s: Step) => void,
    root?: Step,
): boolean => {
    if (!root) {
        return false
    }

    let updated = false

    switch (root.type) {
        case 'ROUTER':
            for (const branch of root.children) {
                if (branch) {
                    const branchUpdated = traverseAndUpdateSubFlow(updater, branch)
                    updated = updated || branchUpdated
                }
            }
            break
        case 'BRANCH':
            const successUpdated = traverseAndUpdateSubFlow(updater, root.onSuccessAction)
            updated = updated || successUpdated
            const failureUpdated = traverseAndUpdateSubFlow(updater, root.onFailureAction)
            updated = updated || failureUpdated
            updater(root)
            updated = true
            break
        case 'LOOP_ON_ITEMS':
            const loopUpdated = traverseAndUpdateSubFlow(updater, root.firstLoopAction)
            updated = updated || loopUpdated
            break
        case 'PIECE':
        case 'PIECE_TRIGGER':
            break
        default:
            break
    }

    const nextUpdated = traverseAndUpdateSubFlow(updater, root.nextAction)
    updated = updated || nextUpdated
    return updated
}

const convertBranchToRouter = (step: any): void => {
    if (step.type === 'BRANCH') {
        step.type = 'ROUTER'
        step.settings = {
            branches: [
                {
                    conditions: step.settings.conditions,
                    branchType: 'CONDITION',
                    branchName: 'On Success',
                },
                {
                    branchType: 'FALLBACK',
                    branchName: 'Otherwise',
                },
            ],
            executionType: 'EXECUTE_FIRST_MATCH',
            inputUiInfo: {
                sampleDataFileId: undefined,
                lastTestDate: undefined,
                customizedInputs: undefined,
                currentSelectedData: undefined,
            },
        }
        step.children = [step.onSuccessAction, step.onFailureAction]
        step.onSuccessAction = undefined
        step.onFailureAction = undefined
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
