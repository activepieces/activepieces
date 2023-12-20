import { Equal, FindOperator, IsNull, LessThan, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'
import { PieceMetadataEntity, PieceMetadataModel, PieceMetadataModelSummary, PieceMetadataSchema } from '../piece-metadata-entity'
import { PieceMetadataService } from './piece-metadata-service'
import { EXACT_VERSION_PATTERN, isNil } from '@activepieces/shared'
import { ActivepiecesError, ErrorCode, apId } from '@activepieces/shared'
import { AllPiecesStats, pieceStatsService } from './piece-stats-service'
import * as semver from 'semver'
import { pieceMetadataServiceHooks as hooks } from './hooks'
import { join } from 'path'
import { cwd } from 'node:process'
import { readFileSync } from 'fs'

const repo = databaseConnection.getRepository(PieceMetadataEntity)

export const DbPieceMetadataService = (): PieceMetadataService => {
    return {
        async list({ release, projectId, platformId, includeHidden }): Promise<PieceMetadataModelSummary[]> {
            const order = {
                name: 'ASC',
                version: 'DESC',
            } as const

            const pieceMetadataEntityList = await repo.createQueryBuilder()
                .where([
                    {
                        minimumSupportedRelease: LessThanOrEqual(release),
                        maximumSupportedRelease: MoreThanOrEqual(release),
                        projectId: Equal(projectId),
                    },
                    {
                        minimumSupportedRelease: LessThanOrEqual(release),
                        maximumSupportedRelease: MoreThanOrEqual(release),
                        projectId: IsNull(),
                    },
                ])
                .distinctOn(['name'])
                .orderBy(order)
                .getMany()

            const pieces = toPieceMetadataModelSummary(pieceMetadataEntityList)

            return hooks.get().filterPieces({
                includeHidden,
                pieces,
                platformId,
            })
        },

        async getOrThrow({ name, version, projectId, language }): Promise<PieceMetadataModel> {
            const projectPiece: Record<string, unknown> = {
                name,
                projectId: Equal(projectId),
            }
            const officialPiece: Record<string, unknown> = {
                name,
                projectId: IsNull(),
            }
            if (version) {
                projectPiece.version = findSearchOperation(version)
                officialPiece.version = findSearchOperation(version)
            }
            const pieceMetadataEntity = await repo.createQueryBuilder()
                .where([
                    projectPiece,
                    officialPiece,
                ])
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

            const translations = loadTranslationsSync(pieceMetadataEntity.name.replace('@activepieces/piece-', ''), language ?? 'en')

            if (translations != null) {
                const translatedPieceMetadataEntity = applyTranslationsToPieceMetadataSchema(pieceMetadataEntity, translations)

                return toPieceMetadataModel(translatedPieceMetadataEntity)
            }


            return toPieceMetadataModel(pieceMetadataEntity)
        },

        async create({ pieceMetadata, projectId, packageType, pieceType, archiveId  }): Promise<PieceMetadataSchema> {
            const existingMetadata = await repo.findOneBy({
                name: pieceMetadata.name,
                version: pieceMetadata.version,
                projectId: projectId ?? IsNull(),
            })

            if (!isNil(existingMetadata)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `piece_metadata_already_exists name=${pieceMetadata.name} version=${pieceMetadata.version} projectId=${projectId}`,
                    },
                })
            }

            return await repo.save({
                id: apId(),
                projectId,
                packageType,
                pieceType,
                archiveId,
                ...pieceMetadata,
            })
        },

        async delete({ projectId, id }): Promise<void> {
            const existingMetadata = await repo.findOneBy({
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
            await repo.delete({
                id,
                projectId: projectId ?? undefined,
            })
        },

        async stats(): Promise<AllPiecesStats> {
            return await pieceStatsService.get()
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

const loadTranslationsSync = (pieceName: string, languageCode: string): Record<string, string> | null => {
    try {
        const translationsPath = join(cwd(), 'dist', 'packages', 'pieces', pieceName, 'translations', `${languageCode}.json`)
        const translationsContent = readFileSync(translationsPath, 'utf8')
        return JSON.parse(translationsContent)
    }
    catch (error) {
        return null
    }
}

const applyTranslationsToPieceMetadataSchema = (pieceMetadata: PieceMetadataSchema, translations: Record<string, string>): PieceMetadataSchema => {
    if (translations[pieceMetadata.displayName]) {
        pieceMetadata.displayName = translations[pieceMetadata.displayName]
    }

    if (pieceMetadata.auth && translations[pieceMetadata.auth.displayName]) {
        pieceMetadata.auth.displayName = translations[pieceMetadata.auth.displayName]
    }

    Object.keys(pieceMetadata.actions).forEach(actionKey => {
        const action = pieceMetadata.actions[actionKey]

        if (translations[action.displayName]) {
            action.displayName = translations[action.displayName]
        }

        if (translations[action.description]) {
            action.description = translations[action.description]
        }

        Object.keys(action.props).forEach(propKey => {
            const prop = action.props[propKey]

            if (translations[prop.displayName]) {
                prop.displayName = translations[prop.displayName]
            }

            if (prop.description && translations[prop.description]) {
                prop.description = translations[prop.description]
            }
        })
    })

    return pieceMetadata
}
