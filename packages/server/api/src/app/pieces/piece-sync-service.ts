import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { AppSystemProp, apVersionUtil } from '@activepieces/server-shared'
import { chunk, isNil, ListVersionsResponse, PackageType, PieceSyncMode, PieceType } from '@activepieces/shared'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { parseAndVerify } from '../helper/json-validator'
import { system } from '../helper/system/system'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { PieceMetadataEntity } from './metadata/piece-metadata-entity'
import { pieceMetadataService } from './metadata/piece-metadata-service'
import pLimit from 'p-limit'

const CLOUD_API_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const piecesRepo = repoFactory(PieceMetadataEntity)
const syncMode = system.get<PieceSyncMode>(AppSystemProp.PIECES_SYNC_MODE)

const axiosClient = axios.create({
    baseURL: CLOUD_API_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
    },
})

type PieceRegistryResponse = {
    name: string
    version: string
}

axiosRetry(axiosClient, {
    retries: 5,
    retryDelay: (_) => 10000,
    retryCondition: (_) => true,
    onRetry: (retryCount, _) => {
        system.globalLogger().warn(`Sync failed, Retrying (${retryCount})...`)
    },
    shouldResetTimeout: true,
})

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
                cron: '0 */1 * * *',
            },
        })
    },
    async sync(): Promise<void> {
        if (syncMode !== PieceSyncMode.OFFICIAL_AUTO) {
            log.info('Piece sync service is disabled')
            return
        }
        try {
            log.info({ time: dayjs().toISOString() }, 'Syncing pieces')
            const cloudPieces = await listCloudPieces()
            const limit = pLimit(200)
            const promises: Promise<PieceMetadataModel | null>[] = []

            for (const piece of cloudPieces) {
                const synced = await existsInDatabase({ name: piece.name, version: piece.version })
                if (!synced) {
                    promises.push(limit(() => readPieceMetadata(piece.name, piece.version, log)))
                }

            }
            const piecesMetadata = await Promise.all(promises)
            await createNewPieces(piecesMetadata.filter((piece) => !isNil(piece)), log)
            await syncDeletedPieces(cloudPieces, log)
        }
        catch (error) {
            log.error({ error }, 'Error syncing pieces')
        }
    },
})

async function readPieceMetadata(name: string, version: string, log: FastifyBaseLogger): Promise<PieceMetadataModel | null> {
    try {
        log.info({ name, version }, 'Reading piece metadata')
        return await getOrThrow({ name, version })
    }
    catch (error) {
        log.error({ error, name, version }, 'Error reading piece')
        return null
    }
}

async function createNewPieces(piecesMetadata: PieceMetadataModel[], log: FastifyBaseLogger): Promise<void> {
    const chunks = chunk(piecesMetadata, 200)

    await Promise.all(chunks.map(async (chunk, i) => {
        chunk = chunk.filter((piece) => piece !== null)
        log.info({ chunkNumber: i, chunkSize: chunk.length }, 'Syncing pieces metadata into database')
        await pieceMetadataService(log).bulkCreate(chunk as PieceMetadataModel[])
        log.info({ chunkNumber: i, chunkSize: chunk.length }, 'Pieces metadata synced into database')
    }))
}

async function syncDeletedPieces(cloudPieces: PieceRegistryResponse[], log: FastifyBaseLogger): Promise<void> {
    const dbPieces = await pieceMetadataService(log).registry({
        edition: system.getEdition(),
        release: await apVersionUtil.getCurrentRelease(),
    })
     const cloudPiecesSet = new Set(
                cloudPieces.map(piece => `${piece.name}:${piece.version}`)
            )
    const dbPiecesToDelete = dbPieces.filter(
        dbPiece => !cloudPiecesSet.has(`${dbPiece.name}:${dbPiece.version}`)
    )
    if (dbPiecesToDelete.length === 0) return 
    log.info({ piecesToDelete: dbPiecesToDelete.length }, 'Deleting pieces from database')
    await pieceMetadataService(log).bulkDelete(dbPiecesToDelete)
    log.info({ piecesToDelete: dbPiecesToDelete.length }, 'Pieces deleted from database')
}

async function existsInDatabase({ name, version }: { name: string, version: string }): Promise<boolean> {
    return piecesRepo().existsBy({
        name,
        version,
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
    })
}

async function getOrThrow({ name, version }: { name: string, version: string }): Promise<PieceMetadataModel> {
    const response = await axiosClient.get<PieceMetadataModel>(`/${name}${version ? '?version=' + version : ''}`)
    return response.data
}

async function listCloudPieces(): Promise<PieceRegistryResponse[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('edition', system.getEdition())
    queryParams.append('release', await apVersionUtil.getCurrentRelease())
    const response = await axiosClient.get<PieceRegistryResponse[]>(`/registry?${queryParams.toString()}`)
    return response.data
}
