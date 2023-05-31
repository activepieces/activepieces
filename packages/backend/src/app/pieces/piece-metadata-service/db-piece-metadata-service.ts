import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'
import { PieceMetadataEntity, PieceMetadataSchema } from '../piece-metadata-entity'
import { GetParams, ListParams, PieceMetadataService } from './piece-metadata-service'
import { PieceBase, PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'
import { isNil } from 'lodash'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'

const repo = databaseConnection.getRepository(PieceMetadataEntity)

const toPieceBase = (pieceMetadataEntity: PieceMetadataSchema): PieceBase => {
    const {
        id: _id,
        created: _created,
        updated: _updated,
        actions: _actions,
        triggers: _triggers,
        ...pieceBase
    } = pieceMetadataEntity

    return pieceBase
}

const toPieceMetadataSummary = (pieceMetadataEntityList: PieceMetadataSchema[]): PieceMetadataSummary[] => {
    return pieceMetadataEntityList.map(pieceMetadataEntity => {
        const pieceBase = toPieceBase(pieceMetadataEntity)

        return {
            ...pieceBase,
            actions: Object.keys(pieceMetadataEntity.actions).length,
            triggers: Object.keys(pieceMetadataEntity.triggers).length,
        }
    })
}

const toPieceMetadata = (pieceMetadataEntity: PieceMetadataSchema): PieceMetadata => {
    const pieceBase = toPieceBase(pieceMetadataEntity)

    return {
        ...pieceBase,
        actions: pieceMetadataEntity.actions,
        triggers: pieceMetadataEntity.triggers,
    }
}

export const DbPieceMetadataService = (): PieceMetadataService => {
    return {
        async list({ release }: ListParams): Promise<PieceMetadataSummary[]> {
            const query = {
                minimumSupportedRelease: LessThanOrEqual(release),
                maximumSupportedRelease: MoreThanOrEqual(release),
            }

            const order = {
                name: 'ASC',
                version: 'DESC',
            } as const

            const pieceMetadataEntityList = await repo.createQueryBuilder()
                .where(query)
                .distinctOn(['name'])
                .orderBy(order)
                .getMany()

            return toPieceMetadataSummary(pieceMetadataEntityList)
        },

        async get({ name, version }: GetParams): Promise<PieceMetadata> {
            const query = {
                name,
                version,
            }

            const pieceMetadataEntity = await repo.findOneBy(query)

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
    }
}
