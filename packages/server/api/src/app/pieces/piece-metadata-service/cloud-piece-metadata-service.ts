import {
    PieceMetadataModel,
    PieceMetadataModelSummary,
    PieceMetadataSchema,
} from '../piece-metadata-entity'
import { PieceMetadataService } from './piece-metadata-service'
import { StatusCodes } from 'http-status-codes'
import {
    ActivepiecesError,
    EXACT_VERSION_PATTERN,
    ErrorCode,
} from '@activepieces/shared'

const CLOUD_API_URL = 'https://cloud.activepieces.com/api/v1/pieces'

const handleHttpErrors = async (response: Response): Promise<void> => {
    if (response.status === StatusCodes.NOT_FOUND.valueOf()) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: 'piece not found',
            },
        })
    }

    if (response.status !== StatusCodes.OK.valueOf()) {
        throw new Error(await response.text())
    }
}

export const CloudPieceMetadataService = (): PieceMetadataService => {
    return {
        async list({
            release,
            searchQuery,
            categories,
            sortBy,
            suggestionType,
            orderBy,
        }): Promise<PieceMetadataModelSummary[]> {
            const queryParams = new URLSearchParams()
            queryParams.append('release', release)
            if (searchQuery) {
                queryParams.append('searchQuery', searchQuery)
            }
            if (suggestionType) {
                queryParams.append('suggestionType', suggestionType)
            }
            if (categories) {
                for (const category of categories) {
                    queryParams.append('categories', category)
                }
            }
            if (sortBy) {
                queryParams.append('sortBy', sortBy)
            }
            if (orderBy) {
                queryParams.append('orderBy', orderBy)
            }
            const url = `${CLOUD_API_URL}?${queryParams.toString()}`
            const response = await fetch(url)

            await handleHttpErrors(response)

            return (await response.json()) as PieceMetadataModelSummary[]
        },

        async getOrThrow({ name, version }): Promise<PieceMetadataModel> {
            const response = await fetch(
                `${CLOUD_API_URL}/${name}${version ? '?version=' + version : ''}`,
            )

            await handleHttpErrors(response)

            return (await response.json()) as PieceMetadataModel
        },

        async create(): Promise<PieceMetadataSchema> {
            throw new Error('operation not supported')
        },

        async delete(): Promise<void> {
            throw new Error('operation not supported')
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
