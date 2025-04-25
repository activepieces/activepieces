import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { ApLock, filePiecesUtils, memoryLock } from '@activepieces/server-shared'
import { assertEqual, assertNotNullOrUndefined, PackageType, PiecePackage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { cacheHandler } from '../utils/cache-handler'
import { workerMachine } from '../utils/machine'
import { packageManager } from '../utils/package-manager'
import { PIECES_BUILDER_MUTEX_KEY } from './development/pieces-builder'
import { PieceManager } from './piece-manager'
enum CacheState {
    READY = 'READY',
    PENDING = 'PENDING',
}

export class LocalPieceManager extends PieceManager {
    protected override async installDependencies(
        params: InstallParams,
    ): Promise<void> {

        let lock: ApLock | undefined
        try {
            lock = await memoryLock.acquire(PIECES_BUILDER_MUTEX_KEY)
            const { projectPath, pieces } = params
            const basePath = resolve(__dirname.split(`${sep}dist`)[0])
            const baseLinkPath = join(
                basePath,
                'dist',
                'packages',
                'pieces',
                'community',
            )
            const packages = workerMachine.getSettings().DEV_PIECES || []

            const frameworkPackages = {
                '@activepieces/pieces-common': `link:${baseLinkPath}/common`,
                '@activepieces/pieces-framework': `link:${baseLinkPath}/framework`,
                '@activepieces/shared': `link:${basePath}/dist/packages/shared`,
            }
            await linkPackages(projectPath, join(baseLinkPath, 'framework'), '@activepieces/pieces-framework', frameworkPackages, params.log)
            await linkPackages(projectPath, join(baseLinkPath, 'common'), '@activepieces/pieces-common', frameworkPackages, params.log)

            for (const piece of pieces) {
                assertEqual(piece.packageType, PackageType.REGISTRY, 'packageType', `Piece ${piece.pieceName} is not of type REGISTRY`)
                const directoryPath = await filePiecesUtils(packages, params.log).findDirectoryByPackageName(piece.pieceName)
                assertNotNullOrUndefined(directoryPath, `directoryPath for ${piece.pieceName} is null or undefined`)
                await linkPackages(projectPath, directoryPath, piece.pieceName, frameworkPackages, params.log)
            }
        }
        finally {
            if (lock) {
                await lock.release()
            }
        }
    }
}

const linkPackages = async (
    projectPath: string,
    linkPath: string,
    packageName: string,
    packages: Record<string, string>,
    log: FastifyBaseLogger,
): Promise<void> => {
    const cache = cacheHandler(projectPath)
    if (await cache.cacheCheckState(packageName) === CacheState.READY) {
        return
    }
    await updatePackageJson(linkPath, packages)
    await packageManager(log).link({
        packageName,
        path: projectPath,
        linkPath,
    })
    await cache.setCache(packageName, CacheState.READY)
}

const updatePackageJson = async (
    directoryPath: string,
    frameworkPackages: Record<string, string>,
): Promise<void> => {
    const packageJsonForPiece = join(directoryPath, 'package.json')

    const packageJson = await readFile(packageJsonForPiece, 'utf-8').then(
        JSON.parse,
    )
    for (const [key, value] of Object.entries(frameworkPackages)) {
        if (
            packageJson.dependencies &&
            Object.keys(packageJson.dependencies).includes(key)
        ) {
            packageJson.dependencies[key] = value
        }
    }
    await writeFile(packageJsonForPiece, JSON.stringify(packageJson, null, 2))
}

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
    log: FastifyBaseLogger
}
