import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../../helper/logger'

const FLOW_VERSION_TABLE = 'flow_version'
const APP_CONNECTION_TABLE = 'app_connection'
const APP_EVENT_ROUTING_TABLE = 'app_event_routing'
const TRIGGER_EVENT = 'trigger_event'

const PIECE_TYPE = 'PIECE'
const PIECE_TRIGGER_TYPE = 'PIECE_TRIGGER'
type Step = {
    type: string
    settings: {
        pieceName: string
        pieceVersion: string
    }
    onFailureAction?: Step
    onSuccessAction?: Step
    firstLoopAction?: Step
    nextAction?: Step
}

export class UnifyPieceName1686138629812 implements MigrationInterface {

    name = 'UnifyPieceName1686138629812'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('UnifyPieceName1686138629812, started')

        const count = await updateFlowVersions(queryRunner, false)
        const connectionCount = await updateAppConnections(queryRunner, false)
        const appEventsRoutCount = await updateAppEventRoutes(queryRunner, false)
        const pieceMetadataCount = await updatePieceMetadata(queryRunner, false)
        const triggerEventCount = await updateTriggerEvent(queryRunner, false)

        logger.info('UnifyPieceName1686138629812, finished renaming ' + count + ' flows and connections count ' + connectionCount + ' appEventsRoutCount ' + appEventsRoutCount + ' pieceMetadataCount ' + pieceMetadataCount + ' triggerEventCount ' + triggerEventCount)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        logger.info('UnifyPieceName1686138629812, reverting')

        const count = await updateFlowVersions(queryRunner, true)
        const connectionCount = await updateAppConnections(queryRunner, true)
        const appEventsRoutCount = await updateAppEventRoutes(queryRunner, true)
        const pieceMetadataCount = await updatePieceMetadata(queryRunner, true)
        const triggerEventCount = await updateTriggerEvent(queryRunner, true)

        logger.info(
            'UnifyPieceName1686138629812, finished reverting renaming ' +
            count + ' flows and connections count ' +
            connectionCount + ' appEventsRoutCount ' +
            appEventsRoutCount + ' pieceMetadataCount ' +
            pieceMetadataCount + ' triggerEventCount ' +
            triggerEventCount)
    }

}

async function updateFlowVersions(queryRunner: QueryRunner, revert: boolean): Promise<number> {
    const flowVersionRepo = queryRunner.connection.getRepository(FLOW_VERSION_TABLE)
    const flowVersions = await queryRunner.query('SELECT * FROM flow_version')
    let count = 0

    for (const flowVersion of flowVersions) {
        const step = flowVersion.trigger
        const update = updateStep(step, revert)

        if (update) {
            count++
            await flowVersionRepo.update(flowVersion.id, flowVersion)
        }
    }

    return count
}

async function updateTriggerEvent(queryRunner: QueryRunner, revert: boolean): Promise<number> {
    const triggerEventRepo = queryRunner.connection.getRepository(TRIGGER_EVENT)
    const triggerEvents = await triggerEventRepo.find()
    let count = 0
    for (const triggerEvent of triggerEvents) {
        if (triggerEvent.source) {
            if (revert) {
                triggerEvent.source = `@activepieces/piece-${triggerEvent.source}`
            }
            else {
                triggerEvent.source = triggerEvent.source.replace('@activepieces/piece-', '')
            }
            count++
            await triggerEventRepo.update(triggerEvent.id, triggerEvent)
        }
    }
    return count
}

async function updateAppConnections(queryRunner: QueryRunner, revert: boolean): Promise<number> {
    const appConnections = await queryRunner.query(`SELECT * FROM ${APP_CONNECTION_TABLE}`)
    let count = 0

    for (const appConnection of appConnections) {
        appConnection.appName = getPackageNameForPiece(appConnection.appName, revert)
        count++
        await queryRunner.query(`UPDATE ${APP_CONNECTION_TABLE} SET "appName" = '${appConnection.appName}' WHERE id = ${appConnection.id}`)
    }

    return count
}

async function updateAppEventRoutes(queryRunner: QueryRunner, revert: boolean): Promise<number> {
    const appEventsRouteRepo = queryRunner.connection.getRepository(APP_EVENT_ROUTING_TABLE)
    const appEventsRoutes = await appEventsRouteRepo.find()
    let count = 0

    for (const appEventsRoute of appEventsRoutes) {
        appEventsRoute.appName = getPackageNameForPiece(appEventsRoute.appName, revert)
        count++
        await appEventsRouteRepo.update(appEventsRoute.id, appEventsRoute)
    }

    return count
}

async function updatePieceMetadata(queryRunner: QueryRunner, revert: boolean): Promise<number> {
    const pieceMetadatas = await queryRunner.connection.query('SELECT * FROM piece_metadata;')
    let count = 0

    for (const pieceMetadata of pieceMetadatas) {
        const updatedName = getPackageNameForPiece(pieceMetadata.name, revert)
        const updateQuery = `UPDATE piece_metadata SET name = '${updatedName}' WHERE id = '${pieceMetadata.id}';`
        await queryRunner.connection.query(updateQuery)
        count++
    }

    return count
}

function updateStep(step: Step | undefined, revert: boolean): boolean {
    let update = false
    while (step) {
        if (step.type === PIECE_TYPE || step.type === PIECE_TRIGGER_TYPE) {
            step.settings.pieceName = getPackageNameForPiece(step.settings.pieceName, revert)!
            update = true
        }
        if (step.firstLoopAction) {
            const result = updateStep(step.firstLoopAction, revert)
            update = update || result
        }
        if (step.onSuccessAction) {
            const result = updateStep(step.onSuccessAction, revert)
            update = update || result
        }
        if (step.onFailureAction) {
            const result = updateStep(step.onFailureAction, revert)
            update = update || result
        }
        step = step.nextAction
    }
    return update
}

const getPackageNameForPiece = (pieceName: string | undefined, revert: boolean): string | undefined => {
    if (!pieceName) {
        return pieceName
    }
    if (revert) {
        return pieceName.replace('@activepieces/piece-', '')
    }
    return `@activepieces/piece-${pieceName}`
}
