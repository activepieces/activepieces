import { Equal, FindOperator, IsNull, LessThan, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { PieceMetadataEntity, PieceMetadataModel, PieceMetadataModelSummary, PieceMetadataSchema } from '../piece-metadata-entity'
import { PieceMetadataService } from './piece-metadata-service'
import { EXACT_VERSION_PATTERN, PieceType, isNil } from '@activepieces/shared'
import { ActivepiecesError, ErrorCode, apId } from '@activepieces/shared'
import { AllPiecesStats, pieceStatsService } from './piece-stats-service'
import * as semver from 'semver'
import { pieceMetadataServiceHooks as hooks } from './hooks'
import { projectService } from '../../project/project-service'

const repo = repoFactory(PieceMetadataEntity)

export const DbPieceMetadataService = (): PieceMetadataService => {
    return {
        async list({ release, projectId, platformId, includeHidden, searchQuery }): Promise<PieceMetadataModelSummary[]> {
            const order = {
                name: 'ASC',
                version: 'DESC',
            } as const

            const pieceMetadataEntityList = await repo().createQueryBuilder()
                .where([
                    {
                        minimumSupportedRelease: LessThanOrEqual(release),
                        maximumSupportedRelease: MoreThanOrEqual(release),
                        projectId: Equal(projectId),
                        pieceType: Equal(PieceType.CUSTOM),
                    },
                    {
                        minimumSupportedRelease: LessThanOrEqual(release),
                        maximumSupportedRelease: MoreThanOrEqual(release),
                        platformId: Equal(platformId),
                        projectId: IsNull(),
                        pieceType: Equal(PieceType.CUSTOM),
                    },
                    {
                        minimumSupportedRelease: LessThanOrEqual(release),
                        maximumSupportedRelease: MoreThanOrEqual(release),
                        projectId: IsNull(),
                        platformId: IsNull(),
                        pieceType: Equal(PieceType.OFFICIAL),
                    },
                ])
                .distinctOn(['name'])
                .orderBy(order)
                .getMany()

            const pieces = await hooks.get().filterPieces({
                includeHidden,
                searchQuery,
                pieces: pieceMetadataEntityList,
                platformId,
            })
            return toPieceMetadataModelSummary(pieces)
        },

        async getOrThrow({ name, version, projectId, entityManager }): Promise<PieceMetadataModel> {

            const filters = await constructPieceFilters({
                name,
                version,
                projectId,
            })
            const pieceMetadataEntity = await repo(entityManager).createQueryBuilder()
                .where(filters)
                .distinctOn(['name'])
                .orderBy({
                    name: 'ASC',
                    version: 'DESC',
                } as const)
                .getOne()

            if (isNil(pieceMetadataEntity)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        message: `piece_metadata_not_found name=${name} version=${version}`,
                    },
                })
            }

            return toPieceMetadataModel(pieceMetadataEntity)
        },

        async create({ pieceMetadata, projectId, platformId, packageType, pieceType, archiveId }): Promise<PieceMetadataSchema> {
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

            return repo().save({
                id: apId(),
                projectId,
                packageType,
                pieceType,
                archiveId,
                platformId,
                ...pieceMetadata,
            })
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

        async stats(): Promise<AllPiecesStats> {
            return pieceStatsService.get()
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
    }
}

const constructPieceFilters = async ({ name, version, projectId }: { name: string, version: string | undefined, projectId: string | undefined }): Promise<Record<string, unknown>[]> => {
    const officialPiecesFilter = createOfficialPiecesFilter(name)
    const filters = [officialPiecesFilter]

    if (!isNil(projectId)) {
        const projectPieceFilter = createProjectPieceFilter(name, projectId)
        filters.push(projectPieceFilter)

        // TODO: this might be database intensive, consider caching, passing platform id from caller cause major changes
        // Don't use GetOneOrThrow Anonymouse Token generates random string for project id
        const project = await projectService.getOne(projectId)
        const platformId = project?.platformId

        if (platformId) {
            const platformPieceFilter = createPlatformPieceFilter(name, platformId)
            filters.push(platformPieceFilter)
        }
    }

    if (version) {
        return applyVersionFilter(filters, version)
    }

    return filters
}

const createOfficialPiecesFilter = (name: string): Record<string, unknown> => ({
    name,
    projectId: IsNull(),
    pieceType: Equal(PieceType.OFFICIAL),
})

const createProjectPieceFilter = (name: string, projectId: string): Record<string, unknown> => ({
    name,
    projectId: Equal(projectId),
    pieceType: Equal(PieceType.CUSTOM),
})

const createPlatformPieceFilter = (name: string, platformId: string): Record<string, unknown> => ({
    name,
    platformId: Equal(platformId),
    projectId: IsNull(),
    pieceType: Equal(PieceType.CUSTOM),
})

const applyVersionFilter = (filters: Record<string, unknown>[], version: string): Record<string, unknown>[] => {
    return filters.map(filter => ({
        ...filter,
        version: findSearchOperation(version),
    }))
}

const toPieceMetadataModelSummary = (pieceMetadataEntityList: PieceMetadataSchema[]): PieceMetadataModelSummary[] => {
    return pieceMetadataEntityList.map(pieceMetadataEntity => {
        return {
            ...pieceMetadataEntity,
            actions: Object.keys(pieceMetadataEntity.actions).length,
            triggers: Object.keys(pieceMetadataEntity.triggers).length,
        }
    })
}

const toPieceMetadataModel = (pieceMetadataEntity: PieceMetadataSchema): PieceMetadataModel => {
    return {
        ...pieceMetadataEntity,
        actions: pieceMetadataEntity.actions,
        triggers: pieceMetadataEntity.triggers,
    }
}

const findSearchOperation = (version: string): FindOperator<string> => {
    if (version.startsWith('^')) {
        return LessThan(increaseMajorVersion(version.substring(1)))
    }
    if (version.startsWith('~')) {
        return LessThan(increaseMinorVersion(version.substring(1)))
    }
    return Equal(version)
}

const increaseMinorVersion = (version: string): string => {
    const incrementedVersion = semver.inc(version, 'minor')
    if (isNil(incrementedVersion)) {
        throw new Error(`Failed to increase minor version ${version}`)
    }
    return incrementedVersion
}

const increaseMajorVersion = (version: string): string => {
    const incrementedVersion = semver.inc(version, 'major')
    if (isNil(incrementedVersion)) {
        throw new Error(`Failed to increase major version ${version}`)
    }
    return incrementedVersion
}
