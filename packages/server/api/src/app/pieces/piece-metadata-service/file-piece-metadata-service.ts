
import { PieceMetadata, PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { filePiecesUtils } from '@activepieces/server-shared'

import {
    ActivepiecesError,
    ErrorCode,
    EXACT_VERSION_REGEX,
    isNil,
    ListVersionsResponse,
    PackageType,
    PieceType,
    ProjectId,
} from '@activepieces/shared'
import { nanoid } from 'nanoid'
import {
    PieceMetadataSchema,
} from '../piece-metadata-entity'
import { pieceMetadataServiceHooks } from './hooks'
import { PieceMetadataService } from './piece-metadata-service'
import { toPieceMetadataModelSummary } from '.'

const loadPiecesMetadata = async (): Promise<PieceMetadata[]> => {
    const pieces = await filePiecesUtils.findAllPieces()
    return pieces.sort((a, b) =>
        a.displayName.toUpperCase().localeCompare(b.displayName.toUpperCase()),
    )
}
export const FilePieceMetadataService = (): PieceMetadataService => {
    return {
        async list(params): Promise<PieceMetadataModelSummary[]> {
            const { projectId } = params
            const originalPiecesMetadata: PieceMetadataSchema[] = (await loadPiecesMetadata()).map((p) => {
                return {
                    id: nanoid(),
                    ...p,
                    projectUsage: 0,
                    pieceType: PieceType.OFFICIAL,
                    packageType: PackageType.REGISTRY,
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                }
            })

            const pieces = await pieceMetadataServiceHooks.get().filterPieces({
                ...params,
                pieces: originalPiecesMetadata,
                suggestionType: params.suggestionType,
            })
            const filteredPieces = pieces.map((p) =>
                toPieceMetadataModel({
                    pieceMetadata: p,
                    projectId,
                }),
            )
            return toPieceMetadataModelSummary(filteredPieces, originalPiecesMetadata, params.suggestionType)

        },
        async updateUsage() {
            throw new Error('Updating pieces is not supported in development mode')
        },
        async getVersions(params): Promise<ListVersionsResponse> {
            const piecesMetadata = await loadPiecesMetadata()
            const pieceMetadata = piecesMetadata.find((p) => p.name === params.name)
            return pieceMetadata?.version ? { [pieceMetadata.version]: {} } : {}
        },
        async get({
            name,
            projectId,
        }): Promise<PieceMetadataModel | undefined> {
            const piecesMetadata = await loadPiecesMetadata()
            const pieceMetadata = piecesMetadata.find((p) => p.name === name)

            if (isNil(pieceMetadata)) {
                return undefined
            }

            return toPieceMetadataModel({
                pieceMetadata,
                projectId,
            })
        },
        async getOrThrow({
            name,
            version,
            projectId,
            platformId,
        }): Promise<PieceMetadataModel> {
            const pieceMetadata = await this.get({
                name,
                version,
                projectId,
                platformId,
            })

            if (isNil(pieceMetadata)) {
                throw new ActivepiecesError({
                    code: ErrorCode.PIECE_NOT_FOUND,
                    params: {
                        pieceName: name,
                        pieceVersion: version,
                        message: 'Pieces is not found in file system',
                    },
                })
            }

            return toPieceMetadataModel({
                pieceMetadata,
                projectId,
            })
        },

        async delete(): Promise<void> {
            throw new Error('Deleting pieces is not supported in development mode')
        },

        async create(): Promise<PieceMetadataModel> {
            throw new Error('Creating pieces is not supported in development mode')
        },

        async getExactPieceVersion({ projectId, platformId, name, version }): Promise<string> {
            const isExactVersion = EXACT_VERSION_REGEX.test(version)

            if (isExactVersion) {
                return version
            }

            const pieceMetadata = await this.getOrThrow({
                projectId,
                platformId,
                name,
                version,
            })

            return pieceMetadata.version
        },
    }
}

const toPieceMetadataModel = ({
    pieceMetadata,
    projectId,
}: ToPieceMetadataModelParams): PieceMetadataModel => {
    return {
        name: pieceMetadata.name,
        displayName: pieceMetadata.displayName,
        description: pieceMetadata.description,
        logoUrl: pieceMetadata.logoUrl,
        version: pieceMetadata.version,
        auth: pieceMetadata.auth,
        projectUsage: 0,
        minimumSupportedRelease: pieceMetadata.minimumSupportedRelease,
        maximumSupportedRelease: pieceMetadata.maximumSupportedRelease,
        actions: pieceMetadata.actions,
        authors: pieceMetadata.authors,
        categories: pieceMetadata.categories,
        triggers: pieceMetadata.triggers,
        directoryPath: pieceMetadata.directoryPath,
        projectId,
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
    }
}



type ToPieceMetadataModelParams = {
    pieceMetadata: PieceMetadata
    projectId?: ProjectId
}
