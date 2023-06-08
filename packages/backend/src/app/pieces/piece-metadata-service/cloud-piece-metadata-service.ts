import { PieceMetadataEntity } from '../piece-metadata-entity'
import { CreateParams, GetParams, PieceMetadataService } from './piece-metadata-service'
import { PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'
import { AllPiecesStats, pieceStatsService } from './piece-stats-service'
import { StatusCodes } from 'http-status-codes'
import { ActivepiecesError, ErrorCode, apId } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { isNil } from 'lodash'
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm'
import { pieceMetadataHelper } from '../piece-metadata-helper'

const CLOUD_API_URL = 'https://cloud.activepieces.com/api/v1/pieces'

const repo = databaseConnection.getRepository(PieceMetadataEntity)

const handleHttpErrors = async (response: Response) => {
    if (response.status === StatusCodes.NOT_FOUND) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: 'piece not found',
            },
        })
    }

    if (response.status !== StatusCodes.OK) {
        throw new Error(await response.text())
    }
}

export const CloudPieceMetadataService = (): PieceMetadataService => {
    return {
        async list({ release, projectId }): Promise<PieceMetadataSummary[]> {
            const query = {
                minimumSupportedRelease: LessThanOrEqual(release),
                maximumSupportedRelease: MoreThanOrEqual(release),
                projectId: projectId,
            }

            const order = {
                name: 'ASC',
                version: 'DESC',
            } as const

            const dbEntityList = pieceMetadataHelper.toPieceMetadataSummary(await repo.createQueryBuilder()
                .where(query)
                .distinctOn(['name'])
                .orderBy(order)
                .getMany())

            const response = await fetch(`${CLOUD_API_URL}?release=${release}`)

            await handleHttpErrors(response)
            const cloudPieceMetadataList = (await response.json()) as PieceMetadataSummary[]
            return [...cloudPieceMetadataList, ...dbEntityList]
        },

        async get({ name, version, projectId }: GetParams): Promise<PieceMetadata> {

            const pieceMetadataEntity = await repo.findOneBy({
                name,
                version,
                projectId: projectId ?? undefined,
            })
            if (!isNil(pieceMetadataEntity)) {
                return pieceMetadataEntity
            }
            const response = await fetch(`${CLOUD_API_URL}/${name}?version=${version}`)

            await handleHttpErrors(response)

            return await response.json() as PieceMetadata
        },

        async create({ pieceMetadata, projectId }: CreateParams): Promise<PieceMetadata> {
            if(isNil(projectId)) {  
                throw new Error('projectId is required and cannot be null')
            }
            const piece = await repo.findOneBy({
                name: pieceMetadata.name,
                version: pieceMetadata.version,
                projectId: projectId,
            })
            if(!isNil(piece)) {
                return piece
            }
            const savedPiece: PieceMetadata = pieceMetadataHelper.toPieceMetadata(await repo.save({
                id: apId(),
                minimumSupportedRelease: pieceMetadata.minimumSupportedRelease ?? '0.0.0',
                maximumSupportedRelease: pieceMetadata.maximumSupportedRelease ?? '99999.99999.99999',
                projectId: projectId,
                ...pieceMetadata,
            }))
            return savedPiece
        },

        async stats(): Promise<AllPiecesStats> {
            return await pieceStatsService.get()
        },
    }
}
