/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-case-declarations */
import { logger } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class SwitchToRouter1731019013340 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const flowVersionIds = await queryRunner.query(
            'SELECT id FROM flow_version WHERE "schemaVersion" IS NULL',
        )
        logger.info(
            'SwitchToRouter1731019013340: found ' +
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
                const trigger = typeof flowVersion[0].trigger === 'string' ? JSON.parse(flowVersion[0].trigger) : flowVersion[0].trigger
                const originalStepCount = countSteps(trigger)
                const updatedTrigger = traverseAndUpdateSubFlow(
                    convertBranchToRouter,
                    JSON.parse(JSON.stringify(trigger)), // Deep clone to avoid modifying original
                )

                const updatedStepCount = countSteps(updatedTrigger)
                if (originalStepCount !== updatedStepCount) {
                    throw new Error(`Step count mismatch for flow ${id}: original=${originalStepCount}, updated=${updatedStepCount}`)
                }

                if (hasBranchType(updatedTrigger)) {
                    throw new Error(`Flow ${id} still contains BRANCH type after migration`)
                }
                await queryRunner.query(
                    'UPDATE flow_version SET trigger = $1, "schemaVersion" = $2 WHERE id = $3',
                    [JSON.stringify(updatedTrigger), '1', flowVersion[0].id],
                )
                updatedFlows++
            }
        }

        logger.info({
            name: 'SwitchToRouter1731019013340: up',
            updatedFlows,
        })
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error('SwitchToRouter1731019013340: down - no rollback supported')
    }
}

const countSteps = (step: Step | undefined): number => {
    if (!step) return 0

    let count = 1

    switch (step.type) {
        case 'ROUTER':
            count += step.children.reduce((acc, child) => acc + countSteps(child), 0)
            break
        case 'BRANCH':
            count += countSteps(step.onSuccessAction) + countSteps(step.onFailureAction)
            break
        case 'LOOP_ON_ITEMS':
            count += countSteps(step.firstLoopAction)
            break
        default:
            break
    }

    count += countSteps(step.nextAction)
    return count
}

const hasBranchType = (step: Step | undefined): boolean => {
    if (!step) return false
    if (step.type === 'BRANCH') return true

    let hasBranch = false
    switch (step.type) {
        case 'ROUTER':
            hasBranch = step.children.some(child => hasBranchType(child))
            break
        case 'LOOP_ON_ITEMS':
            hasBranch = hasBranchType(step.firstLoopAction)
            break
        default:
            break
    }
    if (hasBranchType(step.nextAction)) {
        return true
    }
    return hasBranch
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
        case 'ROUTER':
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
