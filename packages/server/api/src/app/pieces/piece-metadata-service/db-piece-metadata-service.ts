
import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { ActivepiecesError, apId, assertNotNullOrUndefined, ErrorCode, EXACT_VERSION_REGEX, isNil, ListVersionsResponse, PieceType } from '@activepieces/shared'
import dayjs from 'dayjs'
import semVer from 'semver'
import { IsNull } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { pieceTagService } from '../../tags/pieces/piece-tag.service'
import {
    PieceMetadataEntity,
    PieceMetadataSchema,
} from '../piece-metadata-entity'
import { localPieceCache } from './helper/local-piece-cache'
import { pieceMetadataServiceHooks } from './hooks'
import { PieceMetadataService } from './piece-metadata-service'
import { toPieceMetadataModelSummary } from '.'

const repo = repoFactory(PieceMetadataEntity)

export const FastDbPieceMetadataService = (): PieceMetadataService => {
    return {
        async list(params): Promise<PieceMetadataModelSummary[]> {
            const originalPieces = await findAllPiecesVersionsSortedByNameAscVersionDesc(params)
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
            const filteredPieces = await pieceMetadataServiceHooks.get().filterPieces({
                ...params,
                pieces: piecesWithTags,
                suggestionType: params.suggestionType,
            })
            return toPieceMetadataModelSummary(filteredPieces, piecesWithTags, params.suggestionType)
        },
        async get({ projectId, platformId, version, name }): Promise<PieceMetadataModel | undefined> {
            const versionToSearch = findNextExcludedVersion(version)
            const originalPieces = await findAllPiecesVersionsSortedByNameAscVersionDesc({ projectId, platformId, release: undefined })
            const piece = originalPieces.find((piece) => {
                const strictlyLessThan = (isNil(versionToSearch) || (
                    semVer.compare(piece.version, versionToSearch.nextExcludedVersion) < 0
                    && semVer.compare(piece.version, versionToSearch.baseVersion) >= 0
                ))
                return piece.name === name && strictlyLessThan
            })
            return piece
        },
        async getOrThrow({ projectId, version, name, platformId }): Promise<PieceMetadataModel> {
            const piece = await this.get({ projectId, version, name, platformId })
            if (isNil(piece)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        message: `piece_metadata_not_found projectId=${projectId}`,
                    },
                })
            }
            return piece
        },
        async getVersions({ name, projectId, release, platformId }): Promise<ListVersionsResponse> {
            const pieces = await findAllPiecesVersionsSortedByNameAscVersionDesc({ projectId, platformId, release })
            return pieces.filter(p => p.name === name).reverse()
                .reduce((record, pieceMetadata) => {
                    record[pieceMetadata.version] = {}
                    return record
                }, {} as ListVersionsResponse)
        },
        async delete({ projectId, id }): Promise<void> {
            const existingMetadata = await repo().findOneBy({
                id,
                projectId: projectId ?? IsNull(),
            })
            if (isNil(existingMetadata)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        message: `piece_metadata_not_found id=${id}`,
                    },
                })
            }
            await repo().delete({
                id,
                projectId: projectId ?? IsNull(),
            })
        },
        async updateUsage({ id, usage }): Promise<void> {
            const existingMetadata = await repo().findOneByOrFail({
                id,
            })
            await repo().update(id, {
                projectUsage: usage,
                updated: existingMetadata.updated,
                created: existingMetadata.created,
            })
        },
        async getExactPieceVersion({ name, version, projectId, platformId }): Promise<string> {
            const isExactVersion = EXACT_VERSION_REGEX.test(version)

            if (isExactVersion) {
                return version
            }

            const pieceMetadata = await this.getOrThrow({
                projectId,
                name,
                version,
                platformId,
            })

            return pieceMetadata.version
        },
        async create({
            pieceMetadata,
            projectId,
            platformId,
            packageType,
            pieceType,
            archiveId,
        }): Promise<PieceMetadataSchema> {
            const existingMetadata = await repo().findOneBy({
                name: pieceMetadata.name,
                version: pieceMetadata.version,
                projectId: projectId ?? IsNull(),
                platformId: platformId ?? IsNull(),
            })
            if (!isNil(existingMetadata)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `piece_metadata_already_exists name=${pieceMetadata.name} version=${pieceMetadata.version} projectId=${projectId}`,
                    },
                })
            }
            const createdDate = await findOldestCreataDate({
                name: pieceMetadata.name,
                projectId,
                platformId,
            })
            return repo().save({
                id: apId(),
                projectId,
                packageType,
                pieceType,
                archiveId,
                platformId,
                created: createdDate,
                ...pieceMetadata,
            })
        },
    }
}

const findOldestCreataDate = async ({ name, projectId, platformId }: { name: string, projectId: string | undefined, platformId: string | undefined }): Promise<string> => {
    const piece = await repo().findOne({
        where: {
            name,
            projectId: projectId ?? IsNull(),
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

async function findAllPiecesVersionsSortedByNameAscVersionDesc({ projectId, platformId, release }: { projectId?: string, platformId?: string, release: string | undefined }): Promise<PieceMetadataSchema[]> {
    const piece = (await localPieceCache.getSortedbyNameAscThenVersionDesc()).filter((piece) => {
        return isOfficialPiece(piece) || isProjectPiece(projectId, piece) || isPlatformPiece(platformId, piece)
    }).filter((piece) => isSupportedRelease(release, piece))
    return piece
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

function isProjectPiece(projectId: string | undefined, piece: PieceMetadataSchema): boolean {
    if (isNil(projectId)) {
        return false
    }
    return piece.projectId === projectId && piece.pieceType === PieceType.CUSTOM
}

function isPlatformPiece(platformId: string | undefined, piece: PieceMetadataSchema): boolean {
    if (isNil(platformId)) {
        return false
    }
    return piece.platformId === platformId && isNil(piece.projectId) && piece.pieceType === PieceType.CUSTOM
}
