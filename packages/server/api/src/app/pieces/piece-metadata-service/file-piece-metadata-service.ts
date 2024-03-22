import { readdir, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { cwd } from 'node:process'
import { Piece, PieceMetadata } from '@activepieces/pieces-framework'
import {
    ActivepiecesError,
    ApEdition,
    EXACT_VERSION_PATTERN,
    ErrorCode,
    PackageType,
    PieceType,
    ProjectId,
    extractPieceFromModule,
    isNil,
} from '@activepieces/shared'
import { PieceMetadataService } from './piece-metadata-service'
import importFresh from 'import-fresh'
import {
    PieceMetadataModel,
    PieceMetadataModelSummary,
} from '../piece-metadata-entity'
import { pieceMetadataServiceHooks } from './hooks'
import { nanoid } from 'nanoid'
import { exceptionHandler, logger } from 'server-shared'
import { toPieceMetadataModelSummary } from '.'
import { getEdition } from '../../helper/secret-helper'

const loadPiecesMetadata = async (): Promise<PieceMetadata[]> => {
    const pieces = await findAllPieces()
    return pieces.sort((a, b) =>
        a.displayName.toUpperCase().localeCompare(b.displayName.toUpperCase()),
    )
}
async function findAllPieces(): Promise<PieceMetadata[]> {
    const pieces = await loadPiecesFromFolder(resolve(cwd(), 'dist', 'packages', 'pieces'))
    const enterprisePieces = getEdition() === ApEdition.ENTERPRISE ? await loadPiecesFromFolder(resolve(cwd(), 'dist', 'packages', 'ee', 'pieces')) : []
    return [...pieces, ...enterprisePieces]
}

async function loadPiecesFromFolder(folderPath: string): Promise<PieceMetadata[]> {
    try {
        const paths = await traverseFolder(folderPath)
        const pieces = await Promise.all(paths.map((p) => loadPieceFromFolder(p)))
        return pieces.filter((p): p is PieceMetadata => p !== null)
    }
    catch (e) {
        const err = e as Error
        logger.warn({ name: 'FilePieceMetadataService#loadPiecesFromFolder', message: err.message, stack: err.stack })
        return []
    }
}

async function traverseFolder(folderPath: string): Promise<string[]> {
    const paths = []
    const files = await readdir(folderPath)

    for (const file of files) {
        const filePath = join(folderPath, file)
        const fileStats = await stat(filePath)
        if (
            fileStats.isDirectory() &&
            file !== 'node_modules' &&
            file !== 'dist' &&
            file !== 'framework' &&
            file !== 'common'
        ) {
            paths.push(...(await traverseFolder(filePath)))
        }
        else if (file === 'package.json') {
            paths.push(folderPath)
        }
    }
    return paths
}

async function loadPieceFromFolder(
    folderPath: string,
): Promise<PieceMetadata | null> {
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
            ...piece.metadata(),
            name: pieceName,
            version: pieceVersion,
            authors: piece.authors,
            directoryPath: folderPath,
        }
    }
    catch (ex) {
        exceptionHandler.handle(ex)
    }
    return null
}
export const FilePieceMetadataService = (): PieceMetadataService => {
    return {
        async list(params): Promise<PieceMetadataModelSummary[]> {
            const { projectId } = params
            const originalPiecesMetadata = (await loadPiecesMetadata()).map((p) => {
                return {
                    id: nanoid(),
                    ...p,
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

        async getOrThrow({
            name,
            version,
            projectId,
        }): Promise<PieceMetadataModel> {
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
