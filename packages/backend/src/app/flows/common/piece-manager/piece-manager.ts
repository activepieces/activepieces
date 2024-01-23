import { resolve } from 'node:path'
import { PiecePackage, ProjectId, getPackageAliasForPiece, getPackageSpecForPiece, isEmpty } from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { PackageInfo } from '../../../helper/package-manager'
import { enrichErrorContext } from '../../../helper/error-handler'

const PACKAGE_ARCHIVE_PATH = system.getOrThrow(SystemProp.PACKAGE_ARCHIVE_PATH)

export abstract class PieceManager {
    private readonly baseArchivePath = resolve(PACKAGE_ARCHIVE_PATH)

    async install({ projectPath, pieces, projectId }: InstallParams): Promise<void> {
        try {
            if (isEmpty(pieces)) {
                return
            }

            const uniquePieces = this.removeDuplicatedPieces(pieces)

            await this.installDependencies({
                projectPath,
                projectId,
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

    getProjectPackageArchivePath({ projectId }: GetProjectPackageArchivePathParams): string {
        return `${this.baseArchivePath}/${projectId}`
    }

    protected abstract installDependencies(params: InstallParams): Promise<void>

    protected pieceToDependency(projectId: string, piece: PiecePackage): PackageInfo {
        const packageAlias = getPackageAliasForPiece({
            pieceName: piece.pieceName,
            pieceVersion: piece.pieceVersion,
        })

        const projectPackageArchivePath = this.getProjectPackageArchivePath({
            projectId,
        })

        const packageSpec = getPackageSpecForPiece({
            packageType: piece.packageType,
            pieceName: piece.pieceName,
            pieceVersion: piece.pieceVersion,
            packageArchivePath: projectPackageArchivePath,
        })

        return {
            alias: packageAlias,
            spec: packageSpec,
        }
    }

    private removeDuplicatedPieces(pieces: PiecePackage[]): PiecePackage[] {
        return pieces.filter((piece, index, self) =>
            index === self.findIndex((p) => p.pieceName === piece.pieceName && p.pieceVersion === piece.pieceVersion),
        )
    }
}

type InstallParams = {
    projectId: string
    projectPath: string
    pieces: PiecePackage[]
}

type GetProjectPackageArchivePathParams = {
    projectId: ProjectId
}
