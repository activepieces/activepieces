import { resolve, join, sep } from 'node:path'
import { writeFile, readFile } from 'node:fs/promises'
import { logger } from '../../../helper/logger'
import { PieceManager } from './piece-manager'
import { packageManager } from '../../../helper/package-manager'
import { FilePieceMetadataService } from '../../../pieces/piece-metadata-service/file-piece-metadata-service'
import { PiecePackage } from '@activepieces/shared'

const pieceMetadataService = FilePieceMetadataService()

export class LocalPieceManager extends PieceManager {
    protected override async installDependencies(params: InstallParams): Promise<void> {
        logger.debug(params, '[linkDependencies] params')

        const { projectPath, pieces } = params
        const basePath = resolve(__dirname.split(`${sep}dist`)[0])
        const baseLinkPath = join(basePath, 'dist', 'packages', 'pieces')

        const frameworkPackages = {
            '@activepieces/pieces-common': `link:${baseLinkPath}/common`,
            '@activepieces/pieces-framework': `link:${baseLinkPath}/framework`,
            '@activepieces/shared': `link:${basePath}/dist/packages/shared`,
        }

        await linkFrameworkPackages(projectPath, baseLinkPath, frameworkPackages)

        for (const piece of pieces) {
            const pieceMetadata = await pieceMetadataService.getOrThrow({
                name: piece.pieceName,
                version: piece.pieceVersion,
            })
            await updatePackageJson(pieceMetadata.directoryName!, baseLinkPath, frameworkPackages)
            await packageManager.link({
                path: projectPath,
                linkPath: `${baseLinkPath}/${pieceMetadata.directoryName}`,
            })
        }
    }
}

const linkFrameworkPackages = async (projectPath: string, baseLinkPath: string, frameworkPackages: Record<string, string>): Promise<void> => {
    await updatePackageJson('framework', baseLinkPath, frameworkPackages)
    await packageManager.link({
        path: projectPath,
        linkPath: `${baseLinkPath}/framework`,
    })
    await updatePackageJson('common', baseLinkPath, frameworkPackages)
    await packageManager.link({
        path: projectPath,
        linkPath: `${baseLinkPath}/common`,
    })
}

const updatePackageJson = async (directoryName: string, baseLinkPath: string, frameworkPackages: Record<string, string>): Promise<void> => {
    const packageJsonForPiece = `${baseLinkPath}/${directoryName}/package.json`

    const packageJson = await readFile(packageJsonForPiece, 'utf-8').then(JSON.parse)
    for (const [key, value] of Object.entries(frameworkPackages)) {
        if (packageJson.dependencies && Object.keys(packageJson.dependencies).includes(key)) {
            packageJson.dependencies[key] = value
        }
    }
    await writeFile(packageJsonForPiece, JSON.stringify(packageJson, null, 2))
}

type InstallParams = {
    projectPath: string
    pieces: PiecePackage[]
}
