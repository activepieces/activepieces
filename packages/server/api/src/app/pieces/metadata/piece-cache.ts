import { pieceTranslation } from '@activepieces/pieces-framework'
import { AppSystemProp } from '@activepieces/server-shared'
import { ApEnvironment, isNil, LocalesEnum, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { lru, LRU } from 'tiny-lru'
import { IsNull } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { system } from '../../helper/system/system'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { filterPieceBasedOnType, isSupportedRelease, lastVersionOfEachPiece, loadDevPiecesIfEnabled, sortByNameAndVersionDesc } from './utils'

const repo = repoFactory(PieceMetadataEntity)

const ONE_HOUR_CACHE_TTL_MS = 60 * 60 * 1000

let cache: LRU<unknown>
const environment = system.get<ApEnvironment>(AppSystemProp.ENVIRONMENT)
const isTestingEnvironment = environment === ApEnvironment.TESTING

const CACHE_KEY = {
    list: (locale: LocalesEnum): string => `list:${locale}`,
    piece: (name: string, version: string, platformId: string | undefined): string => `piece:${name}:${version}:${platformId ?? 'OFFICIAL'}`,
    registry: (): string => 'registry',
}

export const pieceCache = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            const cacheMaxSize = system.getNumberOrThrow(AppSystemProp.PIECES_CACHE_MAX_ENTRIES)
            cache = lru(cacheMaxSize, ONE_HOUR_CACHE_TTL_MS)
            log.info('[lruPieceCache] LRU piece cache initialized')
        },

        async getList(params: GetListParams): Promise<PieceMetadataSchema[]> {
            const { platformId, locale = LocalesEnum.ENGLISH } = params
            const cacheKey = CACHE_KEY.list(locale)

            const cachedPieces = await getCachedOrFetch(cacheKey, async () => {
                const allPieces = await fetchPiecesFromDB()
                return translateLatestVersionPerPlatform(allPieces, locale)
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
            const allRegistry = await getCachedOrFetch(cacheKey, async () => {
                const allPieces = await fetchPiecesFromDB()
                return allPieces.map(toRegistryEntry)
            })

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

function translateLatestVersionPerPlatform(allPieces: PieceMetadataSchema[], locale: LocalesEnum): PieceMetadataSchema[] {
    if (locale === LocalesEnum.ENGLISH) {
        allPieces.forEach((piece) => {
            piece.i18n = undefined
        })
        return allPieces
    }

    const latestPerPlatform = new Map<string, PieceMetadataSchema>()
    for (const piece of allPieces) {
        const key = `${piece.name}:${piece.platformId ?? ''}`
        if (!latestPerPlatform.has(key)) {
            latestPerPlatform.set(key, piece)
        }
    }

    return allPieces.map((piece) => {
        const key = `${piece.name}:${piece.platformId ?? ''}`
        if (latestPerPlatform.get(key) === piece) {
            const translated = pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: false })
            translated.i18n = undefined
            return translated
        }
        piece.i18n = undefined
        return piece
    })
}

async function fetchPiecesFromDB(): Promise<PieceMetadataSchema[]> {
    const piecesFromDatabase = await repo().find()
    return piecesFromDatabase.sort(sortByNameAndVersionDesc)
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
