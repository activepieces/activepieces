import { ApEnvironment, isNil, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { pubsub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { filterPieceBasedOnType, isSupportedRelease, loadDevPiecesIfEnabled } from './utils'

const repo = repoFactory(PieceMetadataEntity)
const environment = system.get<ApEnvironment>(AppSystemProp.ENVIRONMENT)
const isTestingEnvironment = environment === ApEnvironment.TESTING

let cachedRegistry: PieceRegistryEntry[] | null = null
let inflightRegistry: Promise<PieceRegistryEntry[]> | null = null

export const pieceCache = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            log.info('[pieceCache] Registry cache initialized')
            if (!isTestingEnvironment) {
                await pubsub.subscribe(PIECE_METADATA_REFRESH_CHANNEL, (message: string) => {
                    const parsed = JSON.parse(message) as PieceMetadataRefreshMessage
                    handleRefreshMessage(parsed)
                    log.debug({ type: parsed.type }, '[pieceCache] Handled piece metadata refresh message')
                })
            }
        },

        async getRegistry(params: GetRegistryParams): Promise<PieceRegistryEntry[]> {
            const { release, platformId } = params
            const allRegistry = await getCachedRegistry()

            const devPieces = (await loadDevPiecesIfEnabled(log)).map(toRegistryEntry)

            return [...allRegistry, ...devPieces]
                .filter((piece) => filterPieceBasedOnType(platformId, piece))
                .filter((piece) => isNil(release) || isSupportedRelease(release, piece))
        },
    }
}

async function getCachedRegistry(): Promise<PieceRegistryEntry[]> {
    if (isTestingEnvironment) {
        return fetchRegistryFromDB()
    }
    if (!isNil(cachedRegistry)) {
        return cachedRegistry
    }
    if (!isNil(inflightRegistry)) {
        return inflightRegistry
    }
    inflightRegistry = (async () => {
        try {
            const result = await fetchRegistryFromDB()
            cachedRegistry = result
            return result
        }
        finally {
            inflightRegistry = null
        }
    })()
    return inflightRegistry
}

function toRegistryEntry(piece: PieceMetadataSchema): PieceRegistryEntry {
    return {
        name: piece.name,
        version: piece.version,
        minimumSupportedRelease: piece.minimumSupportedRelease,
        maximumSupportedRelease: piece.maximumSupportedRelease,
        platformId: piece.platformId,
        pieceType: piece.pieceType,
    }
}

async function fetchRegistryFromDB(): Promise<PieceRegistryEntry[]> {
    return repo()
        .createQueryBuilder('pm')
        .select(['pm."name"', 'pm."version"', 'pm."platformId"', 'pm."pieceType"', 'pm."minimumSupportedRelease"', 'pm."maximumSupportedRelease"'])
        .getRawMany<PieceRegistryEntry>()
}

function handleRefreshMessage(message: PieceMetadataRefreshMessage): void {
    switch (message.type) {
        case PieceMetadataRefreshType.CREATE:
        case PieceMetadataRefreshType.DELETE:
        case PieceMetadataRefreshType.BULK_SYNC:
            cachedRegistry = null
            break
    }
}

export const PIECE_METADATA_REFRESH_CHANNEL = 'piece-metadata-refresh'

export enum PieceMetadataRefreshType {
    CREATE = 'CREATE',
    DELETE = 'DELETE',
    BULK_SYNC = 'BULK_SYNC',
}

export type PieceMetadataRefreshMessage =
    | { type: PieceMetadataRefreshType.CREATE, piece: PieceMetadataSchema }
    | { type: PieceMetadataRefreshType.DELETE, pieces: { name: string, version: string }[] }
    | { type: PieceMetadataRefreshType.BULK_SYNC }

export type PieceRegistryEntry = {
    platformId?: string
    pieceType: PieceType
    name: string
    version: string
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}

type GetRegistryParams = {
    release: string | undefined
    platformId?: string
}
