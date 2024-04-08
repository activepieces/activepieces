import dayjs from 'dayjs'
import { StatusCodes } from 'http-status-codes'
import { repoFactory } from '../core/db/repo-factory'
import { flagService } from '../flags/flag.service'
import { parseAndVerify } from '../helper/json-validator'
import { getEdition } from '../helper/secret-helper'
import { systemJobsSchedule } from '../helper/system-jobs'
import { PieceMetadataEntity } from './piece-metadata-entity'
import { pieceMetadataService } from './piece-metadata-service'
import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { logger, system, SystemProp } from '@activepieces/server-shared'
import { ListVersionsResponse, PackageType, PieceSyncMode, PieceType } from '@activepieces/shared'

const CLOUD_API_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const piecesRepo = repoFactory(PieceMetadataEntity)
const syncMode = system.get<PieceSyncMode>(SystemProp.PIECES_SYNC_MODE)
export const pieceSyncService = {
    async setup(): Promise<void> {
        if (syncMode !== PieceSyncMode.OFFICIAL_AUTO) {
            logger.info('Piece sync service is disabled')
            return
        }
        await pieceSyncService.sync()
        await systemJobsSchedule.upsertJob({
            job: {
                name: 'pieces-sync',
                data: {},
            },
            schedule: {
                type: 'repeated',
                cron: '0 */1 * * *',
            },
            async handler() {
                await pieceSyncService.sync()
            },
        })
    },
    async sync(): Promise<void> {
        if (syncMode !== PieceSyncMode.OFFICIAL_AUTO) {
            logger.info('Piece sync service is disabled')
            return
        }
        try {
            logger.info({ time: dayjs().toISOString() }, 'Syncing pieces')
            const pieces = await listPieces()
            const promises: Promise<void>[] = []

            for (const summary of pieces) {
                const lastVersionSynced = await existsInDatabase({ name: summary.name, version: summary.version })
                if (!lastVersionSynced) {
                    promises.push(syncPiece(summary.name))
                }
            }
            await Promise.all(promises)
        }
        catch (error) {
            logger.error({ error }, 'Error syncing pieces')
        }
    },
}

async function syncPiece(name: string): Promise<void> {
    try {
        logger.info({ name }, 'Syncing piece metadata into database')
        const versions = await getVersions({ name })
        for (const version of Object.keys(versions)) {
            const currentVersionSynced = await existsInDatabase({ name, version })
            if (!currentVersionSynced) {
                const piece = await getOrThrow({ name, version })
                await pieceMetadataService.create({
                    pieceMetadata: piece,
                    packageType: piece.packageType,
                    pieceType: piece.pieceType,
                })
            }
        }
    }
    catch (error) {
        logger.error({ error }, 'Error syncing piece, please upgrade the activepieces to latest version')
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
    queryParams.append('edition', getEdition())
    queryParams.append('release', await flagService.getCurrentRelease())
    queryParams.append('name', name)
    const url = `${CLOUD_API_URL}/versions?${queryParams.toString()}`
    const response = await fetch(url)
    return parseAndVerify<ListVersionsResponse>(ListVersionsResponse, (await response.json()))
}

async function getOrThrow({ name, version }: { name: string, version: string }): Promise<PieceMetadataModel> {
    const response = await fetch(
        `${CLOUD_API_URL}/${name}${version ? '?version=' + version : ''}`,
    )
    return response.json()
}

async function listPieces(): Promise<PieceMetadataModelSummary[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('edition', getEdition())
    queryParams.append('release', await flagService.getCurrentRelease())
    const url = `${CLOUD_API_URL}?${queryParams.toString()}`
    const response = await fetch(url)
    if (response.status === StatusCodes.GONE.valueOf()) {
        logger.error({ name }, 'Piece list not found')
        return []
    }
    if (response.status !== StatusCodes.OK.valueOf()) {
        throw new Error(await response.text())
    }
    return response.json()
}
