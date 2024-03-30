
import { PieceType, isNil, ListVersionsResponse, ActivepiecesError, ErrorCode, EXACT_VERSION_PATTERN, apId, assertNotNullOrUndefined } from '@activepieces/shared'
import {
    PieceMetadataEntity,
    PieceMetadataModel,
    PieceMetadataModelSummary,
    PieceMetadataSchema,
} from '../piece-metadata-entity'
import { PieceMetadataService } from './piece-metadata-service'
import { localPieceCache } from './helper/local-piece-cache'
import { toPieceMetadataModelSummary } from '.'
import { repoFactory } from '../../core/db/repo-factory'
import { IsNull } from 'typeorm'
import dayjs from 'dayjs'
import semVer from 'semver'
import { pieceMetadataServiceHooks } from './hooks'
import { projectService } from '../../project/project-service'
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
            const filteredPieces = await pieceMetadataServiceHooks.get().filterPieces({
                ...params,
                pieces: latestVersionOfEachPiece,
                suggestionType: params.suggestionType,
            })
            return toPieceMetadataModelSummary(filteredPieces, latestVersionOfEachPiece, params.suggestionType)
        },
        async getOrThrow({ projectId, version, name }): Promise<PieceMetadataModel> {
            let platformId: string | undefined = undefined
            if (!isNil(projectId)) {
                // TODO: this might be database intensive, consider caching, passing platform id from caller cause major changes
                // Don't use GetOneOrThrow Anonymouse Token generates random string for project id
                const project = await projectService.getOne(projectId)
                platformId = project?.platformId
            }
            const versionToSearch = findNextExcludedVersion(version)

            const originalPieces = await findAllPiecesVersionsSortedByNameAscVersionDesc({ projectId, platformId, release: undefined })
            const piece = originalPieces.find((piece) => {
                return piece.name === name && (isNil(versionToSearch) || semVer.compare(piece.version, versionToSearch) <= 0)
            })
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
                projectId: projectId ?? undefined,
            })
        },
        async updateUsage({ id, usage }): Promise<void> {
            await repo().update(id, {
                projectUsage: usage,
            })
        },
        async getExactPieceVersion({ name, version, projectId }): Promise<string> {
            const isExactVersion = EXACT_VERSION_PATTERN.test(version)

            if (isExactVersion) {
                return version
            }

            const pieceMetadata = await this.getOrThrow({
                projectId,
                name,
                version,
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

const findNextExcludedVersion = (version: string | undefined): string | undefined => {
    if (version?.startsWith('^')) {
        return increaseMajorVersion(version.substring(1))
    }
    if (version?.startsWith('~')) {
        return increaseMinorVersion(version.substring(1))
    }
    return version
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
