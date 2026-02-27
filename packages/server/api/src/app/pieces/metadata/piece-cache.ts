import { pieceTranslation } from '@activepieces/pieces-framework'
import { AppSystemProp } from '@activepieces/server-common'
import { ApEnvironment, isNil, LocalesEnum, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { In, IsNull } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { pubsub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { filterPieceBasedOnType, isNewerVersion, isSupportedRelease, lastVersionOfEachPiece, loadDevPiecesIfEnabled } from './utils'

const repo = repoFactory(PieceMetadataEntity)

let cache: LRU<unknown>
const environment = system.get<ApEnvironment>(AppSystemProp.ENVIRONMENT)
const isTestingEnvironment = environment === ApEnvironment.TESTING

export const PIECE_METADATA_REFRESH_CHANNEL = 'piece-metadata-refresh'

export enum PieceMetadataRefreshType {
    CREATE = 'CREATE',
    DELETE = 'DELETE',
    UPDATE_USAGE = 'UPDATE_USAGE',
}

export type PieceMetadataRefreshMessage =
    | { type: PieceMetadataRefreshType.CREATE, piece: PieceMetadataSchema }
    | { type: PieceMetadataRefreshType.DELETE, pieces: { name: string, version: string }[] }
    | { type: PieceMetadataRefreshType.UPDATE_USAGE, piece: { name: string, version: string, platformId?: string, projectUsage: number } }

const CACHE_KEY = {
    list: (locale: LocalesEnum): string => `list:${locale}`,
    piece: (name: string, version: string, platformId: string | undefined): string => `piece:${name}:${version}:${platformId ?? 'OFFICIAL'}`,
    registry: (): string => 'registry',
}

export const pieceCache = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            const cacheMaxSize = system.getNumberOrThrow(AppSystemProp.PIECES_CACHE_MAX_ENTRIES)
            cache = lru(cacheMaxSize)
            log.info('[lruPieceCache] LRU piece cache initialized')
            if (!isTestingEnvironment) {
                await pubsub.subscribe(PIECE_METADATA_REFRESH_CHANNEL, (message: string) => {
                    const parsed = JSON.parse(message) as PieceMetadataRefreshMessage
                    handleRefreshMessage(parsed)
                    log.debug({ type: parsed.type }, '[lruPieceCache] Handled piece metadata refresh message')
                })
            }
        },

        async getList(params: GetListParams): Promise<PieceMetadataSchema[]> {
            const { platformId, locale = LocalesEnum.ENGLISH } = params
            const cacheKey = CACHE_KEY.list(locale)

            const cachedPieces = await getCachedOrFetch(cacheKey, async () => {
                const latestPieces = await fetchLatestPiecesFromDB()
                return translatePieces(latestPieces, locale)
            })

            const devPieces = await loadDevPiecesIfEnabled(log)
            const translatedDevPieces = devPieces.map((piece) =>
                pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: true }),
            )

            const filteredPieces = [...cachedPieces, ...translatedDevPieces].filter((piece) =>
                filterPieceBasedOnType(platformId, piece),
            )
            return lastVersionOfEachPiece(filteredPieces)
        },

        async getPieceVersion(params: GetPieceVersionParams): Promise<PieceMetadataSchema | null> {
            const { pieceName, version, platformId } = params

            const devPieces = await loadDevPiecesIfEnabled(log)
            const devPiece = devPieces.find(p => p.name === pieceName && p.version === version)
            if (!isNil(devPiece)) {
                return devPiece
            }

            const cacheKey = CACHE_KEY.piece(pieceName, version, platformId)

            return getCachedOrFetch(cacheKey, async () => {
                const foundPiece = await repo().findOne({
                    where: {
                        name: pieceName,
                        version,
                        platformId: platformId ?? IsNull(),
                    },
                })
                return foundPiece ?? null
            })
        },

        async getRegistry(params: GetRegistryParams): Promise<PieceRegistryEntry[]> {
            const { release, platformId } = params
            const cacheKey = CACHE_KEY.registry()
            const allRegistry = await getCachedOrFetch(cacheKey, fetchRegistryFromDB)

            const devPieces = (await loadDevPiecesIfEnabled(log)).map(toRegistryEntry)

            return [...allRegistry, ...devPieces]
                .filter((piece) => filterPieceBasedOnType(platformId, piece))
                .filter((piece) => isNil(release) || isSupportedRelease(release, piece))
        },
    }
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

function translatePieces(pieces: PieceMetadataSchema[], locale: LocalesEnum): PieceMetadataSchema[] {
    if (locale === LocalesEnum.ENGLISH) {
        pieces.forEach((piece) => {
            piece.i18n = undefined
        })
        return pieces
    }

    return pieces.map((piece) => {
        const translated = pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: false })
        translated.i18n = undefined
        return translated
    })
}

async function fetchLatestPiecesFromDB(): Promise<PieceMetadataSchema[]> {
    const allKeys = await repo()
        .createQueryBuilder('pm')
        .select(['pm."id"', 'pm."name"', 'pm."version"', 'pm."platformId"'])
        .getRawMany<PieceKey>()

    const latestIds = pickLatestVersionIds(allKeys)
    return latestIds.length > 0 ? repo().find({ where: { id: In(latestIds) } }) : []
}

function pickLatestVersionIds(pieces: PieceKey[]): string[] {
    const latest = new Map<string, PieceKey>()
    for (const piece of pieces) {
        const key = `${piece.name}:${piece.platformId ?? ''}`
        const existing = latest.get(key)
        if (isNil(existing) || isNewerVersion(piece.version, existing.version)) {
            latest.set(key, piece)
        }
    }
    return Array.from(latest.values()).map(p => p.id)
}

async function fetchRegistryFromDB(): Promise<PieceRegistryEntry[]> {
    return repo()
        .createQueryBuilder('pm')
        .select(['pm."name"', 'pm."version"', 'pm."platformId"', 'pm."pieceType"', 'pm."minimumSupportedRelease"', 'pm."maximumSupportedRelease"'])
        .getRawMany<PieceRegistryEntry>()
}

const inFlightQueries = new Map<string, Promise<unknown>>()

async function getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
): Promise<T> {
    if (isTestingEnvironment) {
        return fetchFn()
    }

    const cached = cache.get(cacheKey) as T | undefined
    if (!isNil(cached)) {
        return cached
    }

    const existingQuery = inFlightQueries.get(cacheKey) as Promise<T> | undefined
    if (!isNil(existingQuery)) {
        return existingQuery
    }

    const queryPromise = (async (): Promise<T> => {
        try {
            const result = await fetchFn()
            cache.set(cacheKey, result)
            return result
        }
        finally {
            inFlightQueries.delete(cacheKey)
        }
    })()

    inFlightQueries.set(cacheKey, queryPromise)

    return queryPromise
}

function handleRefreshMessage(message: PieceMetadataRefreshMessage): void {
    switch (message.type) {
        case PieceMetadataRefreshType.CREATE:
            cache.set(CACHE_KEY.piece(message.piece.name, message.piece.version, message.piece.platformId), message.piece)
            invalidateAggregateCaches()
            break
        case PieceMetadataRefreshType.DELETE:
            for (const piece of message.pieces) {
                cache.delete(CACHE_KEY.piece(piece.name, piece.version, undefined))
            }
            invalidateAggregateCaches()
            break
        case PieceMetadataRefreshType.UPDATE_USAGE: {
            const { piece } = message
            const key = CACHE_KEY.piece(piece.name, piece.version, piece.platformId)
            const cached = cache.get(key) as PieceMetadataSchema | undefined
            if (!isNil(cached)) {
                cache.set(key, { ...cached, projectUsage: piece.projectUsage })
            }
            break
        }
    }
}

function invalidateAggregateCaches(): void {
    invalidateKey(CACHE_KEY.registry())
    for (const locale of Object.values(LocalesEnum)) {
        invalidateKey(CACHE_KEY.list(locale as LocalesEnum))
    }
}

function invalidateKey(cacheKey: string): void {
    cache.delete(cacheKey)
    const inFlight = inFlightQueries.get(cacheKey)
    if (!isNil(inFlight)) {
        void inFlight.then(() => cache.delete(cacheKey))
    }
}

export type PieceRegistryEntry = {
    platformId?: string
    pieceType: PieceType
    name: string
    version: string
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}

type GetPieceVersionParams = {
    pieceName: string
    version: string
    platformId?: string
}

type GetListParams = {
    platformId?: string
    locale?: LocalesEnum
}

type GetRegistryParams = {
    release: string | undefined
    platformId?: string
}

type PieceKey = {
    id: string
    name: string
    version: string
    platformId: string | null
}
