import { resolve } from 'node:path'
import { enrichErrorContext, systemConstants } from '@activepieces/server-shared'
import {
    getPackageAliasForPiece,
    getPackageArchivePathForPiece,
    isEmpty,
    PackageType,
    PiecePackage,
    PieceType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { PackageInfo } from '../package-manager'

export const PACKAGE_ARCHIVE_PATH = resolve(systemConstants.PACKAGE_ARCHIVE_PATH)

export abstract class PieceManager {
    async install({ projectPath, pieces, log }: InstallParams): Promise<void> {
        try {
            if (isEmpty(pieces)) {
                return
            }

            const uniquePieces = this.removeDuplicatedPieces(pieces)

            await this.installDependencies({
                projectPath,
                pieces: uniquePieces,
                log,
            })
        }
        catch (error) {
            const contextKey = '[PieceManager#install]'
            const contextValue = { projectPath }

            const enrichedError = enrichErrorContext({
                error,
                key: contextKey,
                value: contextValue,
            })

            throw enrichedError
        }
    }

    protected abstract installDependencies(params: InstallParams): Promise<void>

    protected pieceToDependency(piece: PiecePackage): PackageInfo {
        const packageAlias = getPackageAliasForPiece(piece)

        const packageSpec = getPackageSpecForPiece(PACKAGE_ARCHIVE_PATH, piece)
        return {
            alias: packageAlias,
            spec: packageSpec,
            standalone: piece.pieceType === PieceType.CUSTOM,
        }
    }

    private removeDuplicatedPieces(pieces: PiecePackage[]): PiecePackage[] {
        return pieces.filter(
            (piece, index, self) =>
                index ===
                self.findIndex(
                    (p) =>
                        p.pieceName === piece.pieceName &&
                        p.pieceVersion === piece.pieceVersion,
                ),
        )
    }
}

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
    log: FastifyBaseLogger
}

const getPackageSpecForPiece = (
    packageArchivePath: string,
    params: PiecePackage,
): string => {
    const { packageType, pieceName, pieceVersion } = params

    switch (packageType) {
        case PackageType.REGISTRY: {
            return `npm:${pieceName}@${pieceVersion}`
        }

        case PackageType.ARCHIVE: {
            const archivePath = getPackageArchivePathForPiece({
                archiveId: params.archiveId,
                archivePath: packageArchivePath,
            })

            return `file:${archivePath}`
        }
    }
}
