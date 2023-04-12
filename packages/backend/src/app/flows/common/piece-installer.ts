import { ApEnvironment, getPackageAliasForPiece, getPackageVersionForPiece } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'
import { packageManager } from '../../helper/package-manager'

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
    const baseLinkPath = '/usr/src/app/dist/packages/pieces'

    for (const piece of pieces) {
        await packageManager.linkDependency(projectPath, `${baseLinkPath}/${piece.name}`)
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

    const dependencies = Object.fromEntries(packages)

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
