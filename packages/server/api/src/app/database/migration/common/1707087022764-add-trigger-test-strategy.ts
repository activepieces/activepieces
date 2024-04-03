import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class AddTriggerTestStrategy1707087022764 implements MigrationInterface {
    name = 'AddTriggerTestStrategy1707087022764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const ids = await getAllPieceMetadataIds(queryRunner)

        for (const id of ids) {
            const pieceMetadata = await getPieceMetadataById(queryRunner, id)
            addTestStrategyToTriggers(pieceMetadata)
            await updatePieceMetadata(queryRunner, pieceMetadata)
        }

        logger.info({ name: 'AddTriggerTestStrategy1707087022764' }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const ids = await getAllPieceMetadataIds(queryRunner)

        for (const id of ids) {
            const pieceMetadata = await getPieceMetadataById(queryRunner, id)
            removeTestStrategyFromTriggers(pieceMetadata)
            await updatePieceMetadata(queryRunner, pieceMetadata)
        }

        logger.info({ name: 'AddTriggerTestStrategy1707087022764' }, 'down')
    }
}

const getAllPieceMetadataIds = async (
    queryRunner: QueryRunner,
): Promise<string[]> => {
    const queryResult: { id: string }[] = await queryRunner.query(
        'SELECT id FROM piece_metadata',
    )
    return queryResult.map(({ id }) => id)
}

const getPieceMetadataById = async (
    queryRunner: QueryRunner,
    id: string,
): Promise<PieceMetadata> => {
    const queryResult = await queryRunner.query(
        'SELECT id, triggers FROM piece_metadata WHERE id = $1',
        [id],
    )
    return queryResult[0]
}

const addTestStrategyToTriggers = (pieceMetadata: PieceMetadata): void => {
    const testStrategyMap: Record<TriggerType, TriggerTestStrategy> = {
        POLLING: 'TEST_FUNCTION',
        WEBHOOK: 'SIMULATION',
        APP_WEBHOOK: 'TEST_FUNCTION',
    }

    pieceMetadata.triggers = parseTriggers(pieceMetadata.triggers)

    for (const trigger of Object.values(pieceMetadata.triggers)) {
        trigger.testStrategy = testStrategyMap[trigger.type]
    }
}

const removeTestStrategyFromTriggers = (pieceMetadata: PieceMetadata): void => {
    pieceMetadata.triggers = parseTriggers(pieceMetadata.triggers)

    for (const trigger of Object.values(pieceMetadata.triggers)) {
        delete trigger.testStrategy
    }
}

const updatePieceMetadata = async (
    queryRunner: QueryRunner,
    pieceMetadata: PieceMetadata,
): Promise<void> => {
    await queryRunner.query(
        'UPDATE piece_metadata SET triggers = $1 WHERE id = $2',
        [JSON.stringify(pieceMetadata.triggers), pieceMetadata.id],
    )
}

const parseTriggers = (triggers: string | Record<string, Trigger>): Record<string, Trigger> => {
    if (typeof triggers === 'string') {
        return JSON.parse(triggers)
    }

    return triggers
}

type TriggerType = 'POLLING' | 'WEBHOOK' | 'APP_WEBHOOK'

type TriggerTestStrategy = 'SIMULATION' | 'TEST_FUNCTION'

type Trigger = {
    type: TriggerType
    testStrategy?: TriggerTestStrategy
}

type PieceMetadata = {
    id: string
    triggers: Record<string, Trigger> | string
}
