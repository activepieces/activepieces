import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileSystemUtils, memoryLock } from '@activepieces/server-shared'
import {
    getPackageArchivePathForPiece,
    PackageType,
    PiecePackage,
    PrivatePiecePackage,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { cacheState } from '../cache/cache-state'
import { PackageInfo, packageManager } from '../cache/package-manager'
import { CacheState } from '../cache/worker-cache'
import { PACKAGE_ARCHIVE_PATH, PieceManager } from './piece-manager'

export class RegistryPieceManager extends PieceManager {
    protected override async installDependencies({
        projectPath,
        pieces,
        log,
    }: InstallParams): Promise<void> {
        await this.savePackageArchivesToDiskIfNotCached(pieces)

        const dependenciesToInstall = await this.filterExistingPieces(projectPath, pieces)
        if (dependenciesToInstall.length === 0) {
            return
        }

        await memoryLock.runExclusive(`pnpm-add-${projectPath}`, async () => {
            const cache = cacheState(projectPath)

            const dependencies = await this.filterExistingPieces(projectPath, pieces)
            if (dependencies.length === 0) {
                return
            }
            for (const dependency of dependencies) {
                const exactVersionPath = join(projectPath, 'pieces', dependency.alias)
                await mkdir(exactVersionPath, { recursive: true })

                if (!dependency.standalone) {
                    await this.writePnpmWorkspaceConfig(projectPath)
                }

                await packageManager(log).add({ path: projectPath, dependencies: [dependency], installDir: exactVersionPath })
            }

            await Promise.all(
                dependencies.map(pkg => cache.setCache(pkg.alias, CacheState.READY)),
            )
        })
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

    private async filterExistingPieces(projectPath: string, pieces: PiecePackage[]): Promise<PackageInfo[]> {
        const cache = cacheState(projectPath)
        const enrichedDependencies = await Promise.all(
            pieces.map(async (piece) => {
                const pkg = this.pieceToDependency(piece)
                const fState = await cache.cacheCheckState(pkg.alias)
                return { pkg, fExists: fState === CacheState.READY }
            }),
        )
        return enrichedDependencies.filter(({ fExists }) => !fExists).map(({ pkg }) => pkg)
    }
}

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
    log: FastifyBaseLogger
}
