import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { AppSystemProp, apVersionUtil } from '@activepieces/server-shared'
import { ListVersionsResponse, PackageType, PieceSyncMode, PieceType } from '@activepieces/shared'
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
            const pieces = await listPieces()
            const limit = pLimit(200)
            const promises: Promise<void>[] = []

            for (const summary of pieces) {
                const lastVersionSynced = await existsInDatabase({ name: summary.name, version: summary.version })
                if (!lastVersionSynced) {
                    promises.push(limit(() => syncPiece(summary.name, log)))
                }
            }
            await Promise.all(promises)
            
        }
        catch (error) {
            log.error({ error }, 'Error syncing pieces')
        }
    },
})

async function syncPiece(name: string, log: FastifyBaseLogger): Promise<void> {
    try {
        const pieceVersionsMetadata: PieceMetadataModel[] = []
        log.info({ name }, 'Syncing piece metadata into database')
        const versions = await getVersions({ name })
        for (const version of Object.keys(versions)) {
            const currentVersionSynced = await existsInDatabase({ name, version })
            if (!currentVersionSynced) {
                const piece = await getOrThrow({ name, version })
                pieceVersionsMetadata.push(piece)
            }
        }
        await pieceMetadataService(log).bulkCreate(pieceVersionsMetadata)
        log.info({ name }, 'Piece metadata synced into database')
    }
    catch (error) {
        log.error(error, 'Error syncing piece, please upgrade the activepieces to latest version')
    }

}
async function existsInDatabase({ name, version }: { name: string, version: string }): Promise<boolean> {
    return piecesRepo().existsBy({
        name,
        version,
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
    })
}

async function getVersions({ name }: { name: string }): Promise<ListVersionsResponse> {
    const queryParams = new URLSearchParams()
    queryParams.append('edition', system.getEdition())
    queryParams.append('release', await apVersionUtil.getCurrentRelease())
    queryParams.append('name', name)
    const response = await axiosClient.get<ListVersionsResponse>(`/versions?${queryParams.toString()}`)
    return parseAndVerify<ListVersionsResponse>(ListVersionsResponse, response.data)
}

async function getOrThrow({ name, version }: { name: string, version: string }): Promise<PieceMetadataModel> {
    const response = await axiosClient.get<PieceMetadataModel>(`/${name}${version ? '?version=' + version : ''}`)
    return response.data
}

async function listPieces(): Promise<PieceMetadataModelSummary[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('edition', system.getEdition())
    queryParams.append('release', await apVersionUtil.getCurrentRelease())
    const response = await axiosClient.get<PieceMetadataModelSummary[]>(`?${queryParams.toString()}`)
    return response.data
}
