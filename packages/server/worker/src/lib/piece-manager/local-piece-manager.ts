import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { logger, packageManager } from '@activepieces/server-shared'
import { PackageType, PiecePackage } from '@activepieces/shared'
import { PieceManager } from './piece-manager'


export class LocalPieceManager extends PieceManager {
    protected override async installDependencies(
        params: InstallParams,
    ): Promise<void> {
        logger.debug(params, '[linkDependencies] params')

        const { projectPath, pieces } = params
        const basePath = resolve(__dirname.split(`${sep}dist`)[0])
        const baseLinkPath = join(
            basePath,
            'dist',
            'packages',
            'pieces',
            'community',
        )

        const frameworkPackages = {
            '@activepieces/pieces-common': `link:${baseLinkPath}/common`,
            '@activepieces/pieces-framework': `link:${baseLinkPath}/framework`,
            '@activepieces/shared': `link:${basePath}/dist/packages/shared`,
        }

        await linkFrameworkPackages(projectPath, baseLinkPath, frameworkPackages)

        for (const piece of pieces) {
            if (piece.packageType === PackageType.REGISTRY) {
                const directoryPath = piece.directoryPath
                await updatePackageJson(directoryPath!, frameworkPackages)
                await packageManager.link({
                    packageName: piece.pieceName,
                    path: projectPath,
                    linkPath: directoryPath!,
                })
            }
            else {
                throw new Error('Pieces in local piece manager must be of type REGISTRY.')
            }
        }
    }
}

const linkFrameworkPackages = async (
    projectPath: string,
    baseLinkPath: string,
    frameworkPackages: Record<string, string>,
): Promise<void> => {
    await updatePackageJson(join(baseLinkPath, 'framework'), frameworkPackages)
    await packageManager.link({
        packageName: '@activepieces/pieces-framework',
        path: projectPath,
        linkPath: `${baseLinkPath}/framework`,
    })
    await updatePackageJson(join(baseLinkPath, 'common'), frameworkPackages)
    await packageManager.link({
        packageName: '@activepieces/pieces-common',
        path: projectPath,
        linkPath: `${baseLinkPath}/common`,
    })
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
}
