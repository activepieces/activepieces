import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { ApLock, filePiecesUtils, fileSystemUtils } from '@activepieces/server-shared'
import { assertEqual, assertNotNullOrUndefined, isEmpty, PackageType, PiecePackage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../../../utils/machine'
import { cacheState, NO_SAVE_GUARD } from '../../cache-state'
import { packageManager } from '../../package-manager'
import { CacheState } from '../../worker-cache'
import { PieceManager } from '../piece-manager'

export class LocalPieceManager extends PieceManager {

    override async install({ projectPath, pieces, log }: InstallParams): Promise<void> {
        if (isEmpty(pieces)) {
            return
        }
        await packageManager(log).init({
            path: projectPath,
        })
        await super.install({ projectPath, pieces, log })
    }

    protected override async installDependencies(
        params: InstallParams,
    ): Promise<void> {

        let lock: ApLock | undefined
        try {
            const { projectPath, pieces } = params
            const basePath = resolve(__dirname.split(`${sep}dist`)[0])
            const communityPiecesDistPath = join(
                basePath,
                'dist',
                'packages',
                'pieces',
                'community',
            )
            const packages = workerMachine.getSettings().DEV_PIECES || []

            const frameworkPackages = {
                '@activepieces/pieces-common': `link:${communityPiecesDistPath}/common`,
                '@activepieces/pieces-framework': `link:${communityPiecesDistPath}/framework`,
                '@activepieces/shared': `link:${basePath}/dist/packages/shared`,
                '@activepieces/common-ai': `link:${communityPiecesDistPath}/common-ai`,
            }
            await linkPackages(projectPath, join(communityPiecesDistPath, 'framework'), '@activepieces/pieces-framework', frameworkPackages, params.log)
            await linkPackages(projectPath, join(communityPiecesDistPath, 'common'), '@activepieces/pieces-common', frameworkPackages, params.log)
            await linkPackages(projectPath, join(communityPiecesDistPath, 'common-ai'), '@activepieces/common-ai', frameworkPackages, params.log)
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
    const pathExists = await fileSystemUtils.fileExists(linkPath)
    if (!pathExists) {
        return
    }
    const cache = cacheState(projectPath, log)
    await cache.getOrSetCache({
        key: packageName,
        cacheMiss: (key: string) => {
            return key !== CacheState.READY
        },
        installFn: async () => {
            await updatePackageJson(linkPath, packages)
            await packageManager(log).link({
                packageName,
                path: projectPath,
                linkPath,
            })
            return CacheState.READY
        },
        skipSave: NO_SAVE_GUARD,
    })
}

const updatePackageJson = async (
    packagePath: string,
    frameworkPackages: Record<string, string>,
): Promise<void> => {
    const packageJsonForPiece = join(packagePath, 'package.json')

    const packageJsonExists = await fileSystemUtils.fileExists(packageJsonForPiece)
    if (!packageJsonExists) {
        return
    }
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
