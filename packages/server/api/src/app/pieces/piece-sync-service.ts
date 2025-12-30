import { AppSystemProp, apVersionUtil, rejectedPromiseHandler } from '@activepieces/server-shared'
import { groupBy, PieceSyncMode } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import semver from 'semver'
import { system } from '../helper/system/system'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../helper/system-jobs/system-job'
import { pieceMetadataService, pieceRepos } from './metadata/piece-metadata-service'
import { PieceMetadataSchema } from './metadata/piece-metadata-entity'

const CLOUD_API_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const syncMode = system.get<PieceSyncMode>(AppSystemProp.PIECES_SYNC_MODE)

export const pieceSyncService = (log: FastifyBaseLogger) => ({
    async setup(): Promise<void> {
        systemJobHandlers.registerJobHandler(SystemJobName.PIECES_SYNC, async function syncPiecesJobHandler(): Promise<void> {
            await pieceSyncService(log).sync()
        })
        rejectedPromiseHandler(pieceSyncService(log).sync(), log)
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
            const [dbPieces, cloudPieces] = await Promise.all([pieceRepos().find({
                select: {
                    name: true,
                    version: true,
                    pieceType: true,
                }
            }), listCloudPieces()])
            await installNewPieces(cloudPieces, dbPieces, log)
            await deletePiecesIfNotOnCloud(dbPieces, cloudPieces, log)

            log.info({
                durationMs: Math.floor(performance.now() - startTime),
            }, 'Piece synchronization completed')
        }
        catch (error) {
            log.error({ error }, 'Error syncing pieces')
        }
    },
})

async function deletePiecesIfNotOnCloud(dbPieces: PieceMetadataOnly[], cloudPieces: PieceRegistryResponse[], log: FastifyBaseLogger) {
    const cloudMap = new Map<string, true>(cloudPieces.map(cloudPiece => [`${cloudPiece.name}:${cloudPiece.version}`, true]))
    const piecesToDelete = dbPieces.filter(piece => !cloudMap.has(`${piece.name}:${piece.version}`))
    await pieceMetadataService(log).bulkDelete(piecesToDelete.map(piece => ({ name: piece.name, version: piece.version })))
}

async function installNewPieces(cloudPieces: PieceRegistryResponse[], dbPieces: PieceMetadataOnly[], log: FastifyBaseLogger) {
    const dbMap = new Map<string, true>(dbPieces.map(dbPiece => [`${dbPiece.name}:${dbPiece.version}`, true]))
    const newPiecesToFetch = cloudPieces.filter(piece => !dbMap.has(`${piece.name}:${piece.version}`))
    const batchSize = 5;
    for (let i = 0; i < newPiecesToFetch.length; i += batchSize) {
        await Promise.all(newPiecesToFetch.slice(i, i + batchSize).map(piece => {
            return async () => {
                const url = `${CLOUD_API_URL}/${piece.name}${piece.version ? '?version=' + piece.version : ''}`
                const response = await fetch(url)
                if (!response.ok) {
                    log.warn({ name: piece.name, version: piece.version, status: response.status }, 'Error reading piece metadata')
                    return
                }
                const pieceMetadata = await response.json()
                await pieceMetadataService(log).create({
                    pieceMetadata,
                    packageType: pieceMetadata.packageType,
                    pieceType: pieceMetadata.pieceType,
                })
            }
        }))
    }
}


async function listCloudPieces(): Promise<PieceRegistryResponse[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('edition', system.getEdition())
    queryParams.append('release', await apVersionUtil.getCurrentRelease())
    const response = await fetch(`${CLOUD_API_URL}/registry?${queryParams.toString()}`)
    if (!response.ok) {
        throw new Error(`Failed to fetch cloud pieces: ${response.status}`)
    }
    const pieces: PieceRegistryResponse[] = await response.json()
    const piecesByName = groupBy(pieces, p => p.name)
    const latest = []
    const others = []

    for (const group of Object.values(piecesByName)) {
        const sortedByVersion = sortByVersionDesc(group)
        latest.push(sortedByVersion[0])
        others.push(...sortedByVersion.slice(1))
    }

    return [...latest, ...others]
}

function sortByVersionDesc(items: PieceRegistryResponse[]) {
    return [...items].sort((a, b) =>
        semver.rcompare(a.version, b.version)
    )
}

type PieceRegistryResponse = {
    name: string
    version: string
}


type PieceMetadataOnly = Pick<PieceMetadataSchema, 'name' | 'version' | 'pieceType'>