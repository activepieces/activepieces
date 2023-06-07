import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../helper/logger'

const FLOW_VERSION_TABLE = 'flow_version'
const APP_CONNECTION_TABLE = 'app_connection'
const APP_EVENT_ROUTING_TABLE = 'app_event_routing'
const PIECE_METADATA = 'piece_metadata'

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

        const count = await updateFlowVersions(queryRunner)
        const connectionCount = await updateAppConnections(queryRunner)
        const appEventsRoutCount = await updateAppEventRoutes(queryRunner)
        const pieceMetadataCount = await updatePieceMetadata(queryRunner)
    
        logger.info('UnifyPieceName1686138629812, finished renaming ' + count + ' flows and connections count ' + connectionCount + ' appEventsRoutCount ' + appEventsRoutCount + ' pieceMetadataCount ' + pieceMetadataCount)
    }

    public async down(): Promise<void> {
        // Ignored
    }

}

async function updateFlowVersions(queryRunner: QueryRunner): Promise<number> {
    const flowVersionRepo = queryRunner.connection.getRepository(FLOW_VERSION_TABLE)
    const flowVersions = await flowVersionRepo.find()
    let count = 0
  
    for (const flowVersion of flowVersions) {
        const step = flowVersion.trigger
        const update = updateStep(step)
  
        if (update) {
            count++
            await flowVersionRepo.update(flowVersion.id, flowVersion)
        }
    }
  
    return count
}
  
async function updateAppConnections(queryRunner: QueryRunner): Promise<number> {
    const appConnectionRepo = queryRunner.connection.getRepository(APP_CONNECTION_TABLE)
    const appConnections = await appConnectionRepo.find()
    let count = 0
  
    for (const appConnection of appConnections) {
        appConnection.appName = getPackageNameForPiece(appConnection.appName)
        count++
        await appConnectionRepo.update(appConnection.id, appConnection)
    }
  
    return count
}
  
async function updateAppEventRoutes(queryRunner: QueryRunner): Promise<number> {
    const appEventsRouteRepo = queryRunner.connection.getRepository(APP_EVENT_ROUTING_TABLE)
    const appEventsRoutes = await appEventsRouteRepo.find()
    let count = 0
  
    for (const appEventsRoute of appEventsRoutes) {
        appEventsRoute.appName = getPackageNameForPiece(appEventsRoute.appName)
        count++
        await appEventsRouteRepo.update(appEventsRoute.id, appEventsRoute)
    }
  
    return count
}
  
async function updatePieceMetadata(queryRunner: QueryRunner): Promise<number> {
    const pieceMetadataRepo = queryRunner.connection.getRepository(PIECE_METADATA)
    const pieceMetadatas = await pieceMetadataRepo.find()
    let count = 0
  
    for (const pieceMetadata of pieceMetadatas) {
        pieceMetadata.name = getPackageNameForPiece(pieceMetadata.name)
        count++
        await pieceMetadataRepo.update(pieceMetadata.id, pieceMetadata)
    }
  
    return count
}

function updateStep(step: Step | undefined): boolean {
    let update = false
    while (step) {
        if (step.type === PIECE_TYPE || step.type === PIECE_TRIGGER_TYPE) {
            step.settings.pieceName = getPackageNameForPiece(step.settings.pieceName)
            update = true
        }
        if (step.firstLoopAction) {
            const result = updateStep(step.firstLoopAction)
            update = update || result
        }
        if (step.onSuccessAction) {
            const result = updateStep(step.onSuccessAction)
            update = update || result
        }
        if (step.onFailureAction) {
            const result = updateStep(step.onFailureAction)
            update = update || result
        }

    }
    return update
}

const getPackageNameForPiece = (pieceName: string): string => {
    return `@activepieces/piece-${pieceName}`
}
  