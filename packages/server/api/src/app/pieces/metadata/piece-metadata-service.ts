import { PieceMetadata, PieceMetadataModel, PieceMetadataModelSummary, PiecePackageInformation, pieceTranslation } from '@activepieces/pieces-framework'
import {
    ActivepiecesError,
    apId,
    assertNotNullOrUndefined,
    ErrorCode,
    EXACT_VERSION_REGEX,
    isNil,
    LocalesEnum,
    PackageType,
    PieceCategory,
    PieceOrderBy,
    PiecePackage,
    PieceSortBy,
    PieceType,
    PlatformId,
    PrivatePiecePackage,
    PublicPiecePackage,
    SuggestionType,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import semVer from 'semver'
import { EntityManager, IsNull } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { enterpriseFilteringUtils } from '../../ee/pieces/filters/piece-filtering-utils'
import { pieceTagService } from '../tags/pieces/piece-tag.service'
import { localPieceCache } from './local-piece-cache'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { pieceListUtils } from './utils'

export const pieceRepos = repoFactory(PieceMetadataEntity)

export const pieceMetadataService = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            await localPieceCache(log).setup()
        },
        async list(params: ListParams): Promise<PieceMetadataModelSummary[]> {
            const translatedPieces = await localPieceCache(log).getList({
                platformId: params.platformId,
                locale: params.locale,
            })
            const piecesWithTags = await enrichTags(params.platformId, translatedPieces, params.includeTags)
            const filteredPieces = await pieceListUtils.filterPieces({
                ...params,
                pieces: piecesWithTags,
                suggestionType: params.suggestionType,
            })

            return toPieceMetadataModelSummary(filteredPieces, translatedPieces, params.suggestionType)
        },
        async registry(params: RegistryParams): Promise<PiecePackageInformation[]> {
            const registry = await localPieceCache(log).getRegistry({ release: params.release })
            return registry.map((piece) => ({
                name: piece.name,
                version: piece.version,
            }))
        },
        async get({ projectId, platformId, version, name }: GetOrThrowParams): Promise<PieceMetadataModel | undefined> {
            const bestMatch = await findExactVersion(log, { name, version, platformId })
            if (isNil(bestMatch)) {
                return undefined
            }
            const piece = await localPieceCache(log).getPieceVersion({
                pieceName: bestMatch.name,
                version: bestMatch.version,
                platformId: bestMatch.platformId,
            })

            if (isNil(piece)) {
                return undefined
            }

            const isFiltered = await enterpriseFilteringUtils.isFiltered({
                piece,
                projectId,
                platformId,
            })
            if (isFiltered) {
                return undefined
            }
            return piece
        },
        async getOrThrow({ version, name, platformId, locale }: GetOrThrowParams): Promise<PieceMetadataModel> {
            const piece = await this.get({ version, name, platformId })
            if (isNil(piece)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        message: `piece_metadata_not_found pieceName=${name}`,
                    },
                })
            }
            const resolvedLocale = locale ?? LocalesEnum.ENGLISH
            return pieceTranslation.translatePiece<PieceMetadataModel>({ piece, locale: resolvedLocale, mutate: true })
        },
        async updateUsage({ id, usage }: UpdateUsage): Promise<void> {
            const existingMetadata = await pieceRepos().findOneByOrFail({
                id,
            })
            await pieceRepos().update(id, {
                projectUsage: usage,
                updated: existingMetadata.updated,
                created: existingMetadata.created,
            })
        },
        async resolveExactVersion({ name, version, platformId }: GetExactPieceVersionParams): Promise<string> {
            const isExactVersion = EXACT_VERSION_REGEX.test(version)

            if (isExactVersion) {
                return version
            }

            const pieceMetadata = await this.getOrThrow({
                name,
                version,
                platformId,
            })

            return pieceMetadata.version
        },
        async create({
            pieceMetadata,
            platformId,
            packageType,
            pieceType,
            archiveId,
        }: CreateParams): Promise<PieceMetadataSchema> {
            const existingMetadata = await pieceRepos().findOneBy({
                name: pieceMetadata.name,
                version: pieceMetadata.version,
                platformId: platformId ?? IsNull(),
            })
            if (!isNil(existingMetadata)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `piece_metadata_already_exists name=${pieceMetadata.name} version=${pieceMetadata.version}`,
                    },
                })
            }
            const createdDate = await findOldestCreatedDate({
                name: pieceMetadata.name,
                platformId,
            })
            return pieceRepos().save({
                id: apId(),
                packageType,
                pieceType,
                archiveId,
                platformId,
                created: createdDate,
                ...pieceMetadata,
            })
        },

        async bulkDelete(pieces: { name: string, version: string }[]): Promise<void> {
            await Promise.all(pieces.map(async (piece) => {
                await pieceRepos().delete({
                    name: piece.name,
                    version: piece.version,
                })
            }))
        },
    }
}

export const getPiecePackageWithoutArchive = async (
    log: FastifyBaseLogger,
    platformId: PlatformId | undefined,
    pkg: Omit<PublicPiecePackage, 'directoryPath' | 'pieceType' | 'packageType'> | Omit<PrivatePiecePackage, 'archiveId' | 'archive' | 'pieceType' | 'packageType'>,
): Promise<PiecePackage> => {
    const pieceMetadata = await pieceMetadataService(log).getOrThrow({
        name: pkg.pieceName,
        version: pkg.pieceVersion,
        platformId,
    })
    switch (pieceMetadata.packageType) {
        case PackageType.ARCHIVE:
            assertNotNullOrUndefined(pieceMetadata.platformId, 'platformId is required')
            return {
                pieceName: pieceMetadata.name,
                pieceVersion: pieceMetadata.version,
                pieceType: pieceMetadata.pieceType,
                packageType: pieceMetadata.packageType,
                archiveId: pieceMetadata.archiveId!,
                platformId: pieceMetadata.platformId,
            }
        case PackageType.REGISTRY: {
            const piecePlatformId = pieceMetadata.platformId
            if (pieceMetadata.pieceType === PieceType.CUSTOM) {
                assertNotNullOrUndefined(piecePlatformId, 'platformId is required')
                return {
                    pieceName: pieceMetadata.name,
                    pieceVersion: pieceMetadata.version,
                    packageType: pieceMetadata.packageType,
                    pieceType: pieceMetadata.pieceType,
                    platformId: piecePlatformId,
                }
            }
            return {
                pieceName: pieceMetadata.name,
                pieceVersion: pieceMetadata.version,
                packageType: pieceMetadata.packageType,
                pieceType: pieceMetadata.pieceType,
            }
        }
    }
}

export function toPieceMetadataModelSummary<T extends PieceMetadataSchema | PieceMetadataModel>(
    pieceMetadataEntityList: T[],
    originalMetadataList: T[],
    suggestionType?: SuggestionType,
): PieceMetadataModelSummary[] {
    return pieceMetadataEntityList.map((pieceMetadataEntity) => {
        const originalMetadata = originalMetadataList.find((p) => p.name === pieceMetadataEntity.name)
        assertNotNullOrUndefined(originalMetadata, `Original metadata not found for ${pieceMetadataEntity.name}`)
        return {
            ...pieceMetadataEntity,
            actions: Object.keys(originalMetadata.actions).length,
            triggers: Object.keys(originalMetadata.triggers).length,
            suggestedActions: suggestionType === SuggestionType.ACTION || suggestionType === SuggestionType.ACTION_AND_TRIGGER ?
                Object.values(pieceMetadataEntity.actions) : undefined,
            suggestedTriggers: suggestionType === SuggestionType.TRIGGER || suggestionType === SuggestionType.ACTION_AND_TRIGGER ?
                Object.values(pieceMetadataEntity.triggers) : undefined,
        }
    })
}

const findOldestCreatedDate = async ({ name, platformId }: { name: string, platformId?: string }): Promise<string> => {
    const piece = await pieceRepos().findOne({
        where: {
            name,
            platformId: platformId ?? IsNull(),
        },
        order: {
            created: 'ASC',
        },
    })
    return piece?.created ?? dayjs().toISOString()
}

const enrichTags = async (platformId: string | undefined, pieces: PieceMetadataSchema[], includeTags: boolean | undefined): Promise<PieceMetadataSchema[]> => {
    if (!includeTags || isNil(platformId)) {
        return pieces
    }
    const tags = await pieceTagService.findByPlatform(platformId)
    return pieces.map((piece) => {
        return {
            ...piece,
            tags: tags[piece.name] ?? [],
        }
    })
}

const sortByVersionDescending = <T extends { version: string }>(a: T, b: T): number => {
    const aValid = semVer.valid(a.version)
    const bValid = semVer.valid(b.version)
    if (!aValid && !bValid) {
        return b.version.localeCompare(a.version)
    }
    if (!aValid) {
        return 1
    }
    if (!bValid) {
        return -1
    }
    return semVer.rcompare(a.version, b.version)
}

const findExactVersion = async (
    log: FastifyBaseLogger,
    params: { name: string, version: string | undefined, platformId: string | undefined },
): Promise<{ name: string, version: string, platformId: string | undefined } | undefined> => {
    const { name, version, platformId } = params
    const versionToSearch = findNextExcludedVersion(version)
    const registry = await localPieceCache(log).getRegistry({ release: undefined, platformId })
    const matchingRegistryEntries = registry.filter((entry) => {
        if (entry.name !== name) {
            return false
        }
        if (isNil(versionToSearch)) {
            return true
        }
        return semVer.compare(entry.version, versionToSearch.nextExcludedVersion) < 0
            && semVer.compare(entry.version, versionToSearch.baseVersion) >= 0
    })

    if (matchingRegistryEntries.length === 0) {
        return undefined
    }

    const sortedEntries = matchingRegistryEntries.sort(sortByVersionDescending)
    return {
        name: sortedEntries[0].name,
        version: sortedEntries[0].version,
        platformId: sortedEntries[0].platformId,
    }
}

const findNextExcludedVersion = (version: string | undefined): { baseVersion: string, nextExcludedVersion: string } | undefined => {
    if (version?.startsWith('^')) {
        const baseVersion = version.substring(1)
        return {
            baseVersion,
            nextExcludedVersion: increaseMajorVersion(baseVersion),
        }
    }
    if (version?.startsWith('~')) {
        const baseVersion = version.substring(1)
        return {
            baseVersion,
            nextExcludedVersion: increaseMinorVersion(baseVersion),
        }
    }
    if (isNil(version)) {
        return undefined
    }
    return {
        baseVersion: version,
        nextExcludedVersion: increasePatchVersion(version),
    }
}

const increasePatchVersion = (version: string): string => {
    const incrementedVersion = semVer.inc(version, 'patch')
    if (isNil(incrementedVersion)) {
        throw new Error(`Failed to increase patch version ${version}`)
    }
    return incrementedVersion
}

const increaseMinorVersion = (version: string): string => {
    const incrementedVersion = semVer.inc(version, 'minor')
    if (isNil(incrementedVersion)) {
        throw new Error(`Failed to increase minor version ${version}`)
    }
    return incrementedVersion
}

const increaseMajorVersion = (version: string): string => {
    const incrementedVersion = semVer.inc(version, 'major')
    if (isNil(incrementedVersion)) {
        throw new Error(`Failed to increase major version ${version}`)
    }
    return incrementedVersion
}


// Types

type ListParams = {
    projectId?: string
    platformId?: string
    includeHidden: boolean
    categories?: PieceCategory[]
    includeTags?: boolean
    tags?: string[]
    sortBy?: PieceSortBy
    orderBy?: PieceOrderBy
    searchQuery?: string
    suggestionType?: SuggestionType
    locale?: LocalesEnum
}

type GetOrThrowParams = {
    name: string
    version?: string
    entityManager?: EntityManager
    projectId?: string
    platformId?: string
    locale?: LocalesEnum
}

type CreateParams = {
    pieceMetadata: PieceMetadata
    platformId?: string
    projectId?: string
    packageType: PackageType
    pieceType: PieceType
    archiveId?: string
}

type UpdateUsage = {
    id: string
    usage: number
}

type GetExactPieceVersionParams = {
    name: string
    version: string
    platformId: PlatformId
}

type RegistryParams = {
    release: string
}
