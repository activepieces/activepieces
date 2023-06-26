import { Equal, IsNull, LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'
import { PieceMetadataEntity, PieceMetadataSchema } from '../piece-metadata-entity'
import { GetParams, ListParams, PieceMetadataService } from './piece-metadata-service'
import { PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'
import { isNil, isNull } from 'lodash'
import { ActivepiecesError, ErrorCode, apId } from '@activepieces/shared'
import { AllPiecesStats, pieceStatsService } from './piece-stats-service'

const repo = databaseConnection.getRepository(PieceMetadataEntity)


const toPieceMetadataSummary = (pieceMetadataEntityList: PieceMetadataSchema[]): PieceMetadataSummary[] => {
    return pieceMetadataEntityList.map(pieceMetadataEntity => {
        return {
            ...pieceMetadataEntity,
            actions: Object.keys(pieceMetadataEntity.actions).length,
            triggers: Object.keys(pieceMetadataEntity.triggers).length,
        }
    })
}

const toPieceMetadata = (pieceMetadataEntity: PieceMetadataSchema): PieceMetadata => {
    return {
        ...pieceMetadataEntity,
        actions: pieceMetadataEntity.actions,
        triggers: pieceMetadataEntity.triggers,
    }
}

export const DbPieceMetadataService = (): PieceMetadataService => {
    return {
        async list({ release, projectId }: ListParams): Promise<PieceMetadataSummary[]> {
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
            return toPieceMetadataSummary(pieceMetadataEntityList)
        },

        async get({ name, version, projectId }: GetParams): Promise<PieceMetadata> {
            const pieceMetadataEntity = await repo.findOneBy([
                {
                    name,
                    version,
                    projectId: Equal(projectId),
                },
                {
                    name,
                    version,
                    projectId: IsNull(),
                },
            ])

            if (isNil(pieceMetadataEntity)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        message: `piece_metadata_not_found name=${name} version=${version}`,
                    },
                })
            }

            return toPieceMetadata(pieceMetadataEntity)
        },

        async create({ projectId, pieceMetadata }): Promise<PieceMetadataSchema> {
            const existingMetadata = await repo.findOneBy({
                name: pieceMetadata.name,
                version: pieceMetadata.version,
                projectId: projectId ?? IsNull(),
            })
            if(!isNull(existingMetadata)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `piece_metadata_already_exists name=${pieceMetadata.name} version=${pieceMetadata.version} projectId=${projectId}`,
                    },
                })
            }
            return await repo.save({
                id: apId(),
                projectId: projectId ?? undefined,
                ...pieceMetadata,
            })
        },

        async delete({projectId, id}): Promise<void> {
            const existingMetadata = await repo.findOneBy({
                id,
                projectId: projectId ?? IsNull(),
            })
            if(isNull(existingMetadata)) {
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
    }
}
