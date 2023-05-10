import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'
import { packageManager } from '../../helper/package-manager'
import { pieceMetadataLoader } from '../../pieces/piece-metadata-loader'
import { ApEnvironment, ProjectId, getPackageAliasForPiece } from '@activepieces/shared'
import { PieceType } from '@activepieces/pieces-framework'
import { fileService } from '../../file/file.service'
import * as fs from 'fs/promises'
import * as path from 'path'

type BaseParams = {
    projectPath: string
    projectId: ProjectId
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
    const basePath = __dirname.split('/dist')[0]
    const baseLinkPath = `${basePath}/dist/packages/pieces`

    for (const piece of pieces) {
        await packageManager.linkDependency(projectPath, `${baseLinkPath}/${piece.name}`)
    }
}

const installDependencies = async (params: InstallDependenciesParams) => {
    log.debug(params, '[InstallDependencies] params')

    const { projectPath, pieces } = params

    const packages = await Promise.all(pieces.map(async piece => {
        let packageVersion
        const pieceManifest = await pieceMetadataLoader.pieceMetadata(params.projectId, piece.name, piece.version)
        if (pieceManifest.type === PieceType.PRIVATE) {
            packageVersion = await getPackageLocalVersionForPiece({
                projectId: params.projectId,
                pieceName: piece.name,
                pieceVersion: piece.version,
                tarFileId: pieceManifest.tarFileId!,
            })
        }
        else {
            packageVersion = getPackageNpmVersionForPiece({
                pieceName: piece.name,
                pieceVersion: piece.version,
            })
        }

        const packageAlias = getPackageAliasForPiece({
            pieceName: piece.name,
            pieceVersion: piece.version,
        })

        return [packageAlias, packageVersion]
    }))

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



const getPackageNpmVersionForPiece = (params: {
    pieceName: string
    pieceVersion: string
}): string => {
    const { pieceName, pieceVersion } = params
    return `npm:@activepieces/piece-${pieceName}@${pieceVersion}`
}

const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.access(filePath)
        return true
    }
    catch (error) {
        return false
    }
}

const getPackageLocalVersionForPiece = async (params: {
    pieceName: string
    pieceVersion: string
    tarFileId: string
    projectId: ProjectId
}): Promise<string> => {
    const tarFilePath = path.join('/', 'tmp', params.projectId, 'pieces', params.pieceName, params.pieceVersion, `${params.pieceName}.tar.gz`)
    const fileAlreadyExists = await fileExists(tarFilePath)
    const alias = 'file:' + tarFilePath
    if (!fileAlreadyExists) {
        const tarFileBuffer = await fileService.getOneOrThrow({
            fileId: params.tarFileId,
            projectId: params.projectId,
        })

        // Save tar file to a path somewhere in workspace
        await fs.mkdir(path.dirname(tarFilePath), { recursive: true })
        await fs.writeFile(tarFilePath, tarFileBuffer.data)
        return 'file:' + tarFilePath
    }
    return alias

}

