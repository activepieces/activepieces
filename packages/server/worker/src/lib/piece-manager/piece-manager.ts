import { resolve } from 'node:path'
import { enrichErrorContext, PackageInfo, system, SystemProp } from '@activepieces/server-shared'
import {
    getPackageAliasForPiece,
    getPackageArchivePathForPiece,
    isEmpty,
    PackageType,
    PiecePackage,
} from '@activepieces/shared'

export const PACKAGE_ARCHIVE_PATH = resolve(
    system.getOrThrow(SystemProp.PACKAGE_ARCHIVE_PATH),
)

export abstract class PieceManager {
    async install({ projectPath, pieces }: InstallParams): Promise<void> {
        try {
            if (isEmpty(pieces)) {
                return
            }

            const uniquePieces = this.removeDuplicatedPieces(pieces)

            await this.installDependencies({
                projectPath,
                pieces: uniquePieces,
            })
        }
        catch (error) {
            const contextKey = '[PieceManager#install]'
            const contextValue = { projectPath, pieces }

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
        const packageAlias = getPackageAliasForPiece({
            pieceName: piece.pieceName,
            pieceVersion: piece.pieceVersion,
        })

        const packageSpec = getPackageSpecForPiece(PACKAGE_ARCHIVE_PATH, piece)
        return {
            alias: packageAlias,
            spec: packageSpec,
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
