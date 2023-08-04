import { ApEnvironment, getPackageAliasForPiece, getPackageVersionForPiece } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'
import { PackageInfo, PackageMetdataInfo, packageManager } from '../../helper/package-manager'
import * as path from 'path'
import fs from 'fs/promises'
import { FilePieceMetadataService } from '../../pieces/piece-metadata-service/file-piece-metadata-service'

type BaseParams = {
    projectPath: string
    pieces: PackageInfo[]
}

type InstallParams = BaseParams

type LinkDependenciesParams = BaseParams

type InstallDependenciesParams = BaseParams

const log = logger.child({ file: 'PieceManager' })

const env = system.get(SystemProp.ENVIRONMENT)

const linkFrameworkPackages = async (projectPath: string, baseLinkPath: string, frameworkPackages: Record<string, string>) => {
    await updatePackageJson('framework', baseLinkPath, frameworkPackages)
    await packageManager.linkDependency(projectPath, `${baseLinkPath}/framework`)
    await updatePackageJson('common', baseLinkPath, frameworkPackages)
    await packageManager.linkDependency(projectPath, `${baseLinkPath}/common`)
}

const linkDependencies = async (params: LinkDependenciesParams) => {
    log.debug(params, '[linkDependencies] params')

    const { projectPath, pieces } = params
    // Get Path before /dist
    const uniquePieces = removeDuplicatedPieces(pieces)
    const basePath = path.resolve(__dirname.split(`${path.sep}dist`)[0])
    const baseLinkPath = path.join(basePath, 'dist', 'packages', 'pieces')

    const frameworkPackages = {
        '@activepieces/pieces-common': `link:${baseLinkPath}/common`,
        '@activepieces/pieces-framework': `link:${baseLinkPath}/framework`,
        '@activepieces/shared': `link:${basePath}/dist/packages/shared`,
    }
    await linkFrameworkPackages(projectPath, baseLinkPath, frameworkPackages)
    for (const piece of uniquePieces) {
        const pieceMetadata = (await FilePieceMetadataService().get({
            projectId: null,
            name: piece.name,
            version: piece.version,
        }))
        await updatePackageJson(pieceMetadata.directoryName!, baseLinkPath, frameworkPackages)
        await packageManager.linkDependency(projectPath, `${baseLinkPath}/${pieceMetadata.directoryName}`)
    }
}

const updatePackageJson = async (directoryName: string, baseLinkPath: string, frameworkPackages: Record<string, string>) => {
    const packageJsonForPiece = `${baseLinkPath}/${directoryName}/package.json`

    const packageJson = await fs.readFile(packageJsonForPiece, 'utf-8').then(JSON.parse)
    for (const [key, value] of Object.entries(frameworkPackages)) {
        if (Object.keys(packageJson.dependencies).includes(key)) {
            packageJson.dependencies[key] = value
        }
    }
    await fs.writeFile(packageJsonForPiece, JSON.stringify(packageJson, null, 2))
}


const installDependencies = async (params: InstallDependenciesParams) => {
    log.debug(params, '[InstallDependencies] params')

    const { projectPath, pieces } = params

    const uniquePieces = removeDuplicatedPieces(pieces)
    const packages: [string, PackageMetdataInfo][] = uniquePieces.map(piece => {
        const packageAlias = getPackageAliasForPiece({
            pieceName: piece.name,
            pieceVersion: piece.version,
        })

        const packageVersion = getPackageVersionForPiece({
            pieceName: piece.name,
            pieceVersion: piece.version,
        })

        return [packageAlias, {
            version: packageVersion,
        }]
    })

    const dependencies = Object.fromEntries(packages)

    await packageManager.addDependencies(projectPath, dependencies)
}

const removeDuplicatedPieces = (pieces: PackageInfo[]) => {
    return pieces.filter((piece, index, self) =>
        index === self.findIndex((p) => p.name === piece.name && p.version === piece.version),
    )
}

export const pieceManager = {
    async install(params: InstallParams) {
        if (env === ApEnvironment.DEVELOPMENT) {
            await linkDependencies(params)
        }
        else {
            await installDependencies(params)
        }
    },
}
