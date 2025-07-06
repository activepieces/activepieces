import { gt } from 'semver'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()
export class UpgradeAgentPieceVersion1751834548223 implements MigrationInterface {
    name = 'UpgradeAgentPieceVersion1751834548223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const flowVersionIds = await queryRunner.query(
            'SELECT id FROM "flow_version" WHERE CAST("trigger" AS TEXT) LIKE \'%@activepieces/piece-agent%\'',
        )
        const allPieceVersions = await queryRunner.query('SELECT name, version FROM piece_metadata')

        if (allPieceVersions.length === 0) {
            log.info('UpgradeAgentPieceVersion1751834548223: no need to migrate, it will be loaded from files directly')
            return
        }

        // Create a map of piece names to their latest versions
        const pieceNameToLatestVersion = new Map<string, string>()
        for (const piece of allPieceVersions) {
            const currentLatest = pieceNameToLatestVersion.get(piece.name)
            if (!currentLatest || gt(piece.version, currentLatest)) {
                pieceNameToLatestVersion.set(piece.name, piece.version)
            }
        }

        log.info(
            'UpgradeAgentPieceVersion1751834548223: found ' +
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
                    (step) => updateVersionOfPieceStep(step, pieceNameToLatestVersion),
                    trigger,
                )
                if (updated) {
                    await queryRunner.connection.getRepository('flow_version').update(flowVersion[0].id, { trigger: updated })
                }
            }
            updatedFlows++
            if (updatedFlows % 100 === 0) {
                log.info(
                    'UpgradeAgentPieceVersion1751834548223: ' +
            updatedFlows +
            ' flows updated',
                )
            }
        }

        log.info('UpgradeAgentPieceVersion1751834548223: up')
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No need to downgrade
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

const updateVersionOfPieceStep = (
    step: Step,
    pieceNameToLatestVersion: Map<string, string>,
): Step => {    
    if (step.type === 'PIECE' || step.type === 'PIECE_TRIGGER') {
        const pieceStep = step as PieceStep
        const latestVersion = pieceNameToLatestVersion.get(pieceStep.settings.pieceName as string)
        if (latestVersion) {
            pieceStep.settings.pieceVersion = latestVersion
        }
        else {
            throw new Error(`Piece ${pieceStep.settings.pieceName} not found`)
        }
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
