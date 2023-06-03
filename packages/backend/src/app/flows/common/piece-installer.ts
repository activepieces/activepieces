import { ApEnvironment, getPackageAliasForPiece, getPackageVersionForPiece } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'
import { packageManager } from '../../helper/package-manager'
import fs from 'fs/promises'

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

    const uniquePieces = removeDuplicatedPieces(pieces)
    const basePath = __dirname.split('/dist')[0]
    const baseLinkPath =`${basePath}/dist/packages/pieces`
    const frameworkPackages = {
        '@activepieces/pieces-common': `link:${baseLinkPath}/common`,
        '@activepieces/pieces-framework': `link:${baseLinkPath}/framework`,
        '@activepieces/shared': `link:${basePath}/dist/packages/shared`,
    }
    for (const piece of uniquePieces) {
        const packageJsonForPiece = `${baseLinkPath}/${piece.name}/package.json`

        const packageJson = await fs.readFile(packageJsonForPiece, 'utf-8').then(JSON.parse)
        for(const [key, value] of Object.entries(frameworkPackages)) {
            if(Object.keys(packageJson.dependencies).includes(key)) {
                packageJson.dependencies[key] = value
            }
        }
        await fs.writeFile(packageJsonForPiece, JSON.stringify(packageJson, null, 2))
        await packageManager.linkDependency(projectPath, `${baseLinkPath}/${piece.name}`)
    }
}

const installDependencies = async (params: InstallDependenciesParams) => {
    log.debug(params, '[InstallDependencies] params')

    const { projectPath, pieces } = params

    const uniquePieces = removeDuplicatedPieces(pieces)
    const packages = uniquePieces.map(piece => {
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

    const dependencies = Object.fromEntries(packages)

    await packageManager.addDependencies(projectPath, dependencies)
}

const removeDuplicatedPieces = (pieces: { name: string, version: string }[]) => {
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
