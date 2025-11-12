import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { apAxios, AppSystemProp, apVersionUtil } from '@activepieces/server-shared'
import { PieceSyncMode, PieceType, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import pLimit from 'p-limit'
import { system } from '../helper/system/system'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { pieceMetadataService, pieceRepos } from './metadata/piece-metadata-service'

const CLOUD_API_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const syncMode = system.get<PieceSyncMode>(AppSystemProp.PIECES_SYNC_MODE)

export const pieceSyncService = (log: FastifyBaseLogger) => ({
    async setup(): Promise<void> {
        systemJobHandlers.registerJobHandler(SystemJobName.PIECES_SYNC, async function syncPiecesJobHandler(): Promise<void> {
            await pieceSyncService(log).sync()
        })
        await pieceSyncService(log).sync()
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.PIECES_SYNC,
                data: {},
            },
            schedule: {
                type: 'repeated',
                cron: `${Math.floor(Math.random() * 5)} */1 * * *`,
            },
        })
    },
    async sync(): Promise<void> {
        if (syncMode !== PieceSyncMode.OFFICIAL_AUTO) {
            log.info('Piece sync service is disabled')
            return
        }
        try {
            log.info('Starting piece synchronization')
            const startTime = performance.now()
            const [cloudPieces, dbPieces] = await Promise.all([listCloudPieces(), pieceRepos().find()])
            const dbMap = new Map<string, true>(dbPieces.map(dbPiece => [`${dbPiece.name}:${dbPiece.version}`, true]))
            const cloudMap = new Map<string, true>(cloudPieces.map(cloudPiece => [`${cloudPiece.name}:${cloudPiece.version}`, true]))

            const newPiecesToFetch = cloudPieces.filter(piece => !dbMap.has(`${piece.name}:${piece.version}`))
            const limit = pLimit(20)
            const newPiecesMetadata = await Promise.all(newPiecesToFetch.map(piece => limit(async () => readPieceMetadata({ name: piece.name, version: piece.version, log }))))
            await pieceMetadataService(log).bulkCreate(newPiecesMetadata.filter((piece): piece is PieceMetadataModel => piece !== null))
            
            const officalPiecesThatIsNotOnCloud = dbPieces.filter(piece =>
                piece.pieceType === PieceType.OFFICIAL &&
                !cloudMap.has(`${piece.name}:${piece.version}`),
            )
            await pieceMetadataService(log).bulkDelete(officalPiecesThatIsNotOnCloud.map(piece => ({ name: piece.name, version: piece.version })))
            log.info({
                newPiecesSynchronized: newPiecesMetadata.length,
                officialPiecesDeleted: officalPiecesThatIsNotOnCloud.length,
                durationMs: Math.floor(performance.now() - startTime),
            }, 'Piece synchronization completed')
        }
        catch (error) {
            log.error({ error }, 'Error syncing pieces')
        }
    },
})


async function readPieceMetadata({ name, version, log }: { name: string, version: string, log: FastifyBaseLogger }): Promise<PieceMetadataModel | null> {
    const { error, data: response } = await tryCatch(() => apAxios.get<PieceMetadataModel>(`${CLOUD_API_URL}/${name}${version ? '?version=' + version : ''}`))
    if (error) {
        log.warn({ name, version, error }, 'Error reading piece metadata')
        return null
    }
    return response.data
}

async function listCloudPieces(): Promise<PieceRegistryResponse[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('edition', system.getEdition())
    queryParams.append('release', await apVersionUtil.getCurrentRelease())
    const response = await apAxios.get<PieceRegistryResponse[]>(`${CLOUD_API_URL}/registry?${queryParams.toString()}`)
    return response.data
}


type PieceRegistryResponse = {
    name: string
    version: string
}

