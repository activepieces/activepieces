import { readdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { cwd } from 'node:process'
import { Piece, PieceMetadata } from '@activepieces/pieces-framework'
import { ActivepiecesError, EXACT_VERSION_PATTERN, ErrorCode, PackageType, PieceType, ProjectId, extractPieceFromModule } from '@activepieces/shared'
import { captureException } from '../../helper/logger'
import { PieceMetadataService } from './piece-metadata-service'
import { isNil } from '@activepieces/shared'
import { AllPiecesStats } from './piece-stats-service'
import importFresh from 'import-fresh'
import { PieceMetadataModel, PieceMetadataModelSummary } from '../piece-metadata-entity'

const loadPiecesMetadata = async (): Promise<PieceMetadata[]> => {
    const ignoredPackages = ['framework', 'apps', 'dist', 'common']
    const piecesPath = resolve(cwd(), 'dist', 'packages', 'pieces')
    const piecePackages = await readdir(piecesPath)
    const filteredPiecePackages = piecePackages.filter(d => !ignoredPackages.includes(d))

    const piecesMetadata: PieceMetadata[] = []

    for (const piecePackage of filteredPiecePackages) {
        try {
            const packageJson = importFresh<Record<string, string>>(join(piecesPath, piecePackage, 'package.json'))
            const module = importFresh<Record<string, unknown>>(join(piecesPath, piecePackage, 'src', 'index'))

            const { name: pieceName, version: pieceVersion } = packageJson
            const piece = extractPieceFromModule<Piece>({
                module,
                pieceName,
                pieceVersion,
            })
            piecesMetadata.push({
                directoryName: piecePackage,
                ...piece.metadata(),
                name: pieceName,
                version: pieceVersion,
            })
        }
        catch (ex) {
            captureException(ex)
        }
    }

    return piecesMetadata.sort((a, b) => a.displayName.toUpperCase().localeCompare(b.displayName.toUpperCase()))
}

export const FilePieceMetadataService = (): PieceMetadataService => {
    return {
        async list({ projectId }): Promise<PieceMetadataModelSummary[]> {
            const piecesMetadata = await loadPiecesMetadata()

            return piecesMetadata.map(p => toPieceMetadataModelSummary({
                pieceMetadata: p,
                projectId,
            }))
        },

        async getOrThrow({ name, version, projectId }): Promise<PieceMetadataModel> {
            const piecesMetadata = await loadPiecesMetadata()
            const pieceMetadata = piecesMetadata.find(p => p.name === name)

            if (isNil(pieceMetadata)) {
                throw new ActivepiecesError({
                    code: ErrorCode.PIECE_NOT_FOUND,
                    params: {
                        pieceName: name,
                        pieceVersion: version,
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

        async stats(): Promise<AllPiecesStats> {
            return {}
        },

        async getExactPieceVersion({ projectId, name, version }): Promise<string> {
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

const toPieceMetadataModel = ({ pieceMetadata, projectId }: ToPieceMetadataModelParams): PieceMetadataModel => {
    return {
        name: pieceMetadata.name,
        displayName: pieceMetadata.displayName,
        description: pieceMetadata.description,
        logoUrl: pieceMetadata.logoUrl,
        version: pieceMetadata.version,
        auth: pieceMetadata.auth,
        minimumSupportedRelease: pieceMetadata.minimumSupportedRelease,
        maximumSupportedRelease: pieceMetadata.maximumSupportedRelease,
        actions: pieceMetadata.actions,
        triggers: pieceMetadata.triggers,
        directoryName: pieceMetadata.directoryName,
        projectId,
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
    }
}

const toPieceMetadataModelSummary = ({ pieceMetadata, projectId }: ToPieceMetadataModelParams): PieceMetadataModelSummary => {
    const pieceMetadataModel = toPieceMetadataModel({
        pieceMetadata,
        projectId,
    })

    return {
        ...pieceMetadataModel,
        actions: Object.keys(pieceMetadataModel.actions).length,
        triggers: Object.keys(pieceMetadataModel.triggers).length,
    }
}

type ToPieceMetadataModelParams = {
    pieceMetadata: PieceMetadata
    projectId?: ProjectId
}
