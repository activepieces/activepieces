import { readdir, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { cwd } from 'node:process'
import { Piece, PieceMetadata } from '@activepieces/pieces-framework'
import { ActivepiecesError, EXACT_VERSION_PATTERN, ErrorCode, PackageType, PieceType, ProjectId, extractPieceFromModule, isNil } from '@activepieces/shared'
import { captureException } from '../../helper/logger'
import { PieceMetadataService } from './piece-metadata-service'
import { AllPiecesStats } from './piece-stats-service'
import importFresh from 'import-fresh'
import { PieceMetadataModel } from '../piece-metadata-entity'
import { pieceMetadataServiceHooks as hooks } from './hooks'
const loadPiecesMetadata = async (): Promise<PieceMetadataModel[]> => {
    const pieces = await findAllPieces()
    return pieces.sort((a, b) =>
        a.displayName.toUpperCase().localeCompare(b.displayName.toUpperCase()),
    ).map(p=>{
        return {
            ...p,
            packageType: PackageType.ARCHIVE,
            pieceType: PieceType.CUSTOM,
        }
    })
}
async function findAllPieces(): Promise<PieceMetadata[]> {
    const piecesPath = resolve(cwd(), 'dist', 'packages', 'pieces')
    const paths = await traverseFolder(piecesPath)
    const pieces = await Promise.all(paths.map((p) => loadPieceFromFolder(p)))
    return pieces.filter((p): p is PieceMetadata => p !== null)
}

async function traverseFolder(folderPath: string): Promise<string[]> {
    const paths = []
    const files = await readdir(folderPath)

    for (const file of files) {
        const filePath = join(folderPath, file)
        const fileStats = await stat(filePath)
        if (fileStats.isDirectory() && file !== 'node_modules' && file !== 'dist' && file !== 'framework' && file !== 'common') {
            paths.push(...await traverseFolder(filePath))
        }
        else if (file === 'package.json') {
            paths.push(folderPath)
        }
    }
    return paths
}

async function loadPieceFromFolder(folderPath: string): Promise<PieceMetadata | null> {
    try {
        const packageJson = importFresh<Record<string, string>>(
            join(folderPath, 'package.json'),
        )
        const module = importFresh<Record<string, unknown>>(
            join(folderPath, 'src', 'index'),
        )

        const { name: pieceName, version: pieceVersion } = packageJson
        const piece = extractPieceFromModule<Piece>({
            module,
            pieceName,
            pieceVersion,
        })
        return {
            directoryPath: folderPath,
            ...piece.metadata(),
            name: pieceName,
            version: pieceVersion,
        }
    }
    catch (ex) {
        captureException(ex)
    }
    return null
}
export const FilePieceMetadataService = (): PieceMetadataService => {
    return {
        async list({  searchQuery }): Promise<PieceMetadataModel[]> {
            const piecesMetadata = await loadPiecesMetadata()

            const pieces = await hooks.get().filterPieces({
                includeHidden: false,
                searchQuery,
                pieces: piecesMetadata,
                
            })
            return pieces
        },

        async getOrThrow({ name, version, projectId }): Promise<PieceMetadataModel> {
            const piecesMetadata = await loadPiecesMetadata()
            const pieceMetadata = piecesMetadata.find((p) => p.name === name)

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
