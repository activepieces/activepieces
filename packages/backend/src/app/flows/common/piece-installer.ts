import { ApEnvironment, getPackageAliasForPiece, getPackageVersionForPiece } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'
import { PackageManagerDependencies, packageManager } from '../../helper/package-manager'
import * as path from 'path'
import fs from 'fs/promises'
import { FilePieceMetadataService } from '../../pieces/piece-metadata-service/file-piece-metadata-service'

type BaseParams = {
    projectPath: string
    pieces: {
        name: string
        version: string
    }[]
}

type InstallParams = BaseParams

type LinkDependenciesParams = BaseParams

type InstallDependenciesParams = BaseParams

const log = logger.child({ file: 'PieceManager' })

const env = system.getOrThrow(SystemProp.ENVIRONMENT)

const linkDependencies = async (params: LinkDependenciesParams) => {
    log.debug(params, '[linkDependencies] params')

    const { projectPath, pieces } = params
    // Get Path before /dist
    const basePath = path.resolve(__dirname.split('/dist')[0])
    const baseLinkPath = path.join(basePath, 'dist', 'packages', 'pieces')
    const frameworkPackages = {
        '@activepieces/pieces-common': `link:${baseLinkPath}/common`,
        '@activepieces/pieces-framework': `link:${baseLinkPath}/framework`,
        '@activepieces/shared': `link:${basePath}/dist/packages/shared`,
    }
    for (const piece of pieces) {
        const pieceMetadata =( await FilePieceMetadataService().get({
            projectId: null,
            name: piece.name,
            version: piece.version,
        }))
        const packageJsonForPiece = `${baseLinkPath}/${pieceMetadata.directoryName}/package.json`

        const packageJson = await fs.readFile(packageJsonForPiece, 'utf-8').then(JSON.parse)
        for(const [key, value] of Object.entries(frameworkPackages)) {
            if(Object.keys(packageJson.dependencies).includes(key)) {
                packageJson.dependencies[key] = value
            }
        }
        await fs.writeFile(packageJsonForPiece, JSON.stringify(packageJson, null, 2))

        await packageManager.linkDependency(projectPath, `${baseLinkPath}/${pieceMetadata.directoryName}`)
    }
}

const installDependencies = async (params: InstallDependenciesParams) => {
    log.debug(params, '[InstallDependencies] params')

    const { projectPath, pieces } = params

    const packages = pieces.map(piece => {
        const packageAlias = getPackageAliasForPiece({
            pieceName: piece.name,
            pieceVersion: piece.version,
        })

        const packageVersion = getPackageVersionForPiece({
            pieceName: piece.name,
            pieceVersion: piece.version,
        })

        return [packageAlias, packageVersion]
    })

    const dependencies: PackageManagerDependencies = Object.fromEntries(packages)

    await packageManager.addDependencies(projectPath, dependencies)
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
