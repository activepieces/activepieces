import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileSystemUtils } from '@activepieces/server-shared'
import {
    getPackageArchivePathForPiece,
    PackageType,
    PiecePackage,
    PrivatePiecePackage,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { cacheState, NO_SAVE_GUARD } from '../../cache-state'
import { packageManager } from '../../package-manager'
import { CacheState } from '../../worker-cache'
import { PACKAGE_ARCHIVE_PATH, PieceManager } from '../piece-manager'

export class RegistryPieceManager extends PieceManager {
    protected override async installDependencies({
        projectPath,
        pieces,
        log,
    }: InstallParams): Promise<void> {
        await this.savePackageArchivesToDiskIfNotCached(pieces)

        const cache = cacheState(projectPath, log)
        
        await Promise.all(
            pieces.map(async (piece) => {
                const pkg = this.pieceToDependency(piece)
                
                await cache.getOrSetCache({
                    key: pkg.alias,
                    cacheMiss: (value: string) => {
                        return value !== CacheState.READY
                    },
                    installFn: async () => {
                        const exactVersionPath = join(projectPath, 'pieces', pkg.alias)
                        await mkdir(exactVersionPath, { recursive: true })

                        if (!pkg.standalone) {
                            await this.writePnpmWorkspaceConfig(projectPath)
                        }

                        await packageManager(log).add({ 
                            path: projectPath, 
                            dependencies: [pkg], 
                            installDir: exactVersionPath,
                        })
                        return CacheState.READY
                    },
                    skipSave: NO_SAVE_GUARD,
                })
            }),
        )
    }

    private async writePnpmWorkspaceConfig(projectPath: string): Promise<void> {
        const workspaceConfig = `packages:
  - "pieces/*"
`
        const workspaceFilePath = join(projectPath, 'pnpm-workspace.yaml')
        await writeFile(workspaceFilePath, workspaceConfig)
    }

    private async savePackageArchivesToDiskIfNotCached(
        pieces: PiecePackage[],
    ): Promise<void> {
        const packages = await this.getUncachedArchivePackages(pieces)
        const saveToDiskJobs = packages.map((piece) =>
            this.getArchiveAndSaveToDisk(piece),
        )
        await Promise.all(saveToDiskJobs)
    }

    private async getUncachedArchivePackages(
        pieces: PiecePackage[],
    ): Promise<PrivatePiecePackage[]> {
        const packages: PrivatePiecePackage[] = []

        for (const piece of pieces) {
            if (piece.packageType !== PackageType.ARCHIVE) {
                continue
            }

            const archivePath = getPackageArchivePathForPiece({
                archiveId: piece.archiveId,
                archivePath: PACKAGE_ARCHIVE_PATH,
            })

            if (await fileSystemUtils.fileExists(archivePath)) {
                continue
            }

            packages.push(piece)
        }

        return packages
    }

    private async getArchiveAndSaveToDisk(
        piece: PrivatePiecePackage,
    ): Promise<void> {
        const archiveId = piece.archiveId

        const archivePath = getPackageArchivePathForPiece({
            archiveId,
            archivePath: PACKAGE_ARCHIVE_PATH,
        })

        await fileSystemUtils.threadSafeMkdir(dirname(archivePath))

        await writeFile(archivePath, piece.archive as Buffer)
    }

}

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
    log: FastifyBaseLogger
}
