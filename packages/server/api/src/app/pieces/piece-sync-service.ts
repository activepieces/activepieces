import { PackageType, PieceSyncMode, PieceType } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { PieceMetadataEntity, PieceMetadataModel, PieceMetadataModelSummary } from './piece-metadata-entity'
import { pieceMetadataService } from './piece-metadata-service'
import { repoFactory } from '../core/db/repo-factory'
import { SystemProp, logger, system } from 'server-shared'
import dayjs from 'dayjs'
import { getEdition } from '../helper/secret-helper'
import { flagService } from '../flags/flag.service'
import { parseAndVerify } from '../helper/json-validator'
import { Type } from '@sinclair/typebox'

const CLOUD_API_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const piecesRepo = repoFactory(PieceMetadataEntity)
const ONE_HOUR_IN_MS = 60 * 60 * 1000
const syncMode = system.get<PieceSyncMode>(SystemProp.PIECES_SYNC_MODE)
export const pieceSyncService = {
    async setup(): Promise<void> {
        if (syncMode !== PieceSyncMode.OFFICIAL_AUTO) {
            logger.info('Piece sync service is disabled')
            return
        }

        this.sync().catch((error) => logger.error({ error }, 'Error syncing pieces'))
        setInterval(() => this.sync(), ONE_HOUR_IN_MS)
    },
    async sync(): Promise<void> {
        if (syncMode !== PieceSyncMode.OFFICIAL_AUTO) {
            logger.info('Piece sync service is disabled')
            return
        }
        try {
            logger.info({ time: dayjs().toISOString() }, 'Syncing pieces')
            const pieces = await listPieces()
            for (const summary of pieces) {
                try {
                    const lastVersionSynced = await existsInDatabase({ name: summary.name, version: summary.version })
                    if (!lastVersionSynced) {
                        await syncPiece(summary.name)
                    }
                }
                catch (error) {
                    logger.error({ error, name: summary.name }, 'Error syncing piece')
                }
            }
        }
        catch (error) {
            logger.error({ error }, 'Error syncing pieces')
        }
    },
}

async function syncPiece(name: string): Promise<void> {
    const versions = await getVersions({ name })
    for (const version of versions) {
        const currentVersionSynced = await existsInDatabase({ name, version })
        if (!currentVersionSynced) {
            const piece = await getOrThrow({ name, version })
            logger.info({ name, version }, 'Syncing piece')
            await pieceMetadataService.create({
                pieceMetadata: piece,
                packageType: piece.packageType,
                pieceType: piece.pieceType,
            })
        }
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

async function getVersions({ name }: { name: string }): Promise<string[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('edition', getEdition())
    queryParams.append('release', await flagService.getCurrentRelease())
    const url = `${CLOUD_API_URL}/${name}/versions?${queryParams.toString()}`
    const response = await fetch(url)
    return parseAndVerify<string[]>(Type.Array(Type.String()), (await response.json()))
}

async function getOrThrow({ name, version }: { name: string, version: string }): Promise<PieceMetadataModel> {
    const response = await fetch(
        `${CLOUD_API_URL}/${name}${version ? '?version=' + version : ''}`,
    )
    return parseAndVerify<PieceMetadataModel>(PieceMetadataModel, await response.json())
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
    return parseAndVerify<PieceMetadataModelSummary[]>(Type.Array(PieceMetadataModelSummary), await response.json())
}
