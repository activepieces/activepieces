import { PieceMetadataSchema } from '../piece-metadata-entity'
import { GetParams, ListParams, PieceMetadataService } from './piece-metadata-service'
import { PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'
import { AllPiecesStats, pieceStatsService } from './piece-stats-service'

const CLOUD_API_URL = 'https://cloud.activepieces.com/v1/pieces'

export const CloudPieceMetadataService = (): PieceMetadataService => {
    return {
        async list({ release }: ListParams): Promise<PieceMetadataSummary[]> {
            const response = await fetch(`${CLOUD_API_URL}?release=${release}`)

            return await response.json() as PieceMetadataSummary[]
        },

        async get({ name, version }: GetParams): Promise<PieceMetadata> {
            const response = await fetch(`${CLOUD_API_URL}/${name}?version=${version}`)

            return await response.json() as PieceMetadata
        },

        async create(): Promise<PieceMetadataSchema> {
            throw new Error('operation not supported')
        },

        async stats(): Promise<AllPiecesStats> {
            return await pieceStatsService.get()
        },
    }
}
