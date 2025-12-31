import { PieceMetadata, PieceMetadataModel, PieceMetadataModelSummary, PiecePackageInformation, pieceTranslation } from '@activepieces/pieces-framework'
import { AppSystemProp, filePiecesUtils } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ApEdition,
    apId,
    assertNotNullOrUndefined,
    ErrorCode,
    EXACT_VERSION_REGEX,
    isEmpty,
    isNil,
    ListVersionsResponse,
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
import { system } from '../../helper/system/system'
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
            const originalPieces = await findAllPiecesVersionsSortedByNameAscVersionDesc({
                ...params,
                log,
            })
            const uniquePieces = new Set<string>(originalPieces.map((piece) => piece.name))
            const latestVersionOfEachPiece = Array.from(uniquePieces).map((name) => {
                const result = originalPieces.find((piece) => piece.name === name)
                const usageCount = originalPieces.filter((piece) => piece.name === name).reduce((acc, piece) => {
                    return acc + piece.projectUsage
                }, 0)
                assertNotNullOrUndefined(result, 'piece_metadata_not_found')
                return {
                    ...result,
                    projectUsage: usageCount,
                }
            })
            const piecesWithTags = await enrichTags(params.platformId, latestVersionOfEachPiece, params.includeTags)
            const translatedPieces = piecesWithTags.map((piece) => pieceTranslation.translatePiece<PieceMetadataSchema>(piece, params.locale))
            const filteredPieces = await pieceListUtils.filterPieces({
                ...params,
                pieces: translatedPieces,
                suggestionType: params.suggestionType,
            })

            return toPieceMetadataModelSummary(filteredPieces, piecesWithTags, params.suggestionType)
        },
        async registry(params: RegistryParams): Promise<PiecePackageInformation[]> {
            const allPieces = await findAllPiecesVersionsSortedByNameAscVersionDesc({
                release: params.release,
                platformId: params.platformId,
                log,
            })
            return allPieces.map((piece) => {
                return {
                    name: piece.name,
                    version: piece.version,
                }
            })
        },
        async get({ projectId, platformId, version, name }: GetOrThrowParams): Promise<PieceMetadataModel | undefined> {
            const versionToSearch = findNextExcludedVersion(version)
            const originalPieces = await findAllPiecesVersionsSortedByNameAscVersionDesc({
                platformId,
                release: undefined,
                log,
            })
            const piece = originalPieces.find((piece) => {
                const strictlyLessThan = (isNil(versionToSearch) || (
                    semVer.compare(piece.version, versionToSearch.nextExcludedVersion) < 0
                    && semVer.compare(piece.version, versionToSearch.baseVersion) >= 0
                ))
                return piece.name === name && strictlyLessThan
            })
            const isFiltered = !isNil(piece) && await enterpriseFilteringUtils.isFiltered({
                piece,
                projectId,
                platformId,
            })
            if (isFiltered) {
                return undefined
            }
            return piece
        },
        async getAllUnfiltered(platformId: PlatformId): Promise<Map<string, PieceMetadataModel>> {
            const allPieces = await findAllPiecesVersionsSortedByNameAscVersionDesc({
                platformId,
                release: undefined,
                log,
            })
            
            const pieceMap = new Map<string, PieceMetadataModel>()
            for (const piece of allPieces) {
                if (!pieceMap.has(piece.name)) {
                    pieceMap.set(piece.name, piece)
                }
            }
            return pieceMap
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
            return pieceTranslation.translatePiece<PieceMetadataModel>(piece, locale)
        },
        async getVersions({ name, release, platformId }: ListVersionsParams): Promise<ListVersionsResponse> {
            const pieces = await findAllPiecesVersionsSortedByNameAscVersionDesc({
                platformId,
                release,
                log,
            })
            return pieces.filter(p => p.name === name).reverse()
                .reduce((record, pieceMetadata) => {
                    record[pieceMetadata.version] = {}
                    return record
                }, {} as ListVersionsResponse)
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

const loadDevPiecesIfEnabled = async (log: FastifyBaseLogger): Promise<PieceMetadataSchema[]> => {
    const devPiecesConfig = system.get(AppSystemProp.DEV_PIECES)
    if (isNil(devPiecesConfig) || isEmpty(devPiecesConfig)) {
        return []
    }
    const piecesNames = devPiecesConfig.split(',')
    const pieces = await filePiecesUtils(log).loadDistPiecesMetadata(piecesNames)

    return pieces.map((p): PieceMetadataSchema => ({
        id: apId(),
        ...p,
        projectUsage: 0,
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    }))
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

async function findAllPiecesVersionsSortedByNameAscVersionDesc({
    platformId,
    release,
    log,
}: {
    platformId?: string
    release: string | undefined
    log: FastifyBaseLogger
}): Promise<PieceMetadataSchema[]> {
    const piecesFromDatabase = await localPieceCache(log).getSortedbyNameAscThenVersionDesc()
    const piecesFromDatabaseFiltered = piecesFromDatabase.filter((piece) => (isOfficialPiece(piece) || isCustomPiece(platformId, piece)) && isSupportedRelease(release, piece))

    const piecesFromDevelopment = await loadDevPiecesIfEnabled(log)

    return [...piecesFromDatabaseFiltered, ...piecesFromDevelopment]
}

function isSupportedRelease(release: string | undefined, piece: PieceMetadataSchema): boolean {
    if (isNil(release)) {
        return true
    }
    if (!isNil(piece.maximumSupportedRelease) && semVer.compare(release, piece.maximumSupportedRelease) == 1) {
        return false
    }
    if (!isNil(piece.minimumSupportedRelease) && semVer.compare(release, piece.minimumSupportedRelease) == -1) {
        return false
    }
    return true
}

function isOfficialPiece(piece: PieceMetadataSchema): boolean {
    return piece.pieceType === PieceType.OFFICIAL && isNil(piece.projectId) && isNil(piece.platformId)
}

function isCustomPiece(platformId: string | undefined, piece: PieceMetadataSchema): boolean {
    if (isNil(platformId)) {
        return false
    }
    return piece.platformId === platformId && isNil(piece.projectId) && piece.pieceType === PieceType.CUSTOM
}

// Types

type ListParams = {
    release: string
    projectId?: string
    platformId?: string
    includeHidden: boolean
    edition: ApEdition
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

type ListVersionsParams = {
    name: string
    projectId?: string
    release?: string
    edition: ApEdition
    platformId?: string
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
    platformId?: string
    edition: ApEdition
}
