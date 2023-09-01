import { GetParams, PieceMetadataService } from './piece-metadata-service'
import { PieceMetadata, PieceMetadataSummary } from '@activepieces/pieces-framework'
import { AllPiecesStats } from './piece-stats-service'
import { CloudPieceMetadataService } from './cloud-piece-metadata-service'
import { DbPieceMetadataService } from './db-piece-metadata-service'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'

const cloudPieceProvider = CloudPieceMetadataService()
const dbPieceProvider = DbPieceMetadataService()

export const AggregatedPieceMetadataService = (): PieceMetadataService => {
    return {
        async list({ release, projectId }): Promise<PieceMetadataSummary[]> {
            const cloudMetadata = await cloudPieceProvider.list({
                release,
                projectId,
            })
            const dbMetadata = await dbPieceProvider.list({
                release,
                projectId,
            })
            return [...cloudMetadata, ...dbMetadata]
        },

        async get({ name, version, projectId }: GetParams): Promise<PieceMetadata> {
            try {
                const dbMetadata = await dbPieceProvider.get({
                    name, version, projectId,
                })
                return dbMetadata
            }
            catch (e) {
                if (e instanceof ActivepiecesError && (e as ActivepiecesError).error.code === ErrorCode.ENTITY_NOT_FOUND) {
                    const cloudMetadata = await cloudPieceProvider.get({
                        name, version, projectId,
                    })
                    return cloudMetadata
                }
                throw e
            }
        },

        async create(params): Promise<PieceMetadata> {
            return dbPieceProvider.create(params)
        },

        async delete(params): Promise<void> {
            return dbPieceProvider.delete(params)
        },

        async stats(): Promise<AllPiecesStats> {
            throw new Error('operation not supported')
        },

        async getExactPieceVersion(params): Promise<string> {
            return await dbPieceProvider.getExactPieceVersion(params)
        },
    }
}
