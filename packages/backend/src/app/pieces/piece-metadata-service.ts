import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { databaseConnection } from '../database/database-connection'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'

type ListParams = {
    release: string
}

type GetParams = {
    name: string
    version: string
}

const repo = databaseConnection.getRepository(PieceMetadataEntity)

export const pieceMetadataService = {
    async list({ release }: ListParams): Promise<PieceMetadataSchema[]> {
        const query = {
            minimumSupportedRelease: LessThanOrEqual(release),
            maximumSupportedRelease: MoreThanOrEqual(release),
        }

        const order = {
            name: 'ASC',
            version: 'DESC',
        } as const

        return await repo.createQueryBuilder()
            .where(query)
            .distinctOn(['name'])
            .orderBy(order)
            .getMany()
    },

    async get({ name, version }: GetParams): Promise<PieceMetadataSchema | null> {
        const query = {
            name,
            version,
        }

        return await repo.findOneBy(query)
    },
}
