import fs from 'fs/promises'
import path from 'path'
import { Action, Piece, PiecePropertyMap, Trigger } from '@activepieces/pieces-framework'
import { ActivepiecesError, ErrorCode, ExecutePropsOptions, extractPieceFromModule, getPackageAliasForPiece, isNil } from '@activepieces/shared'
import { utils } from '../utils'

export const pieceLoader = {
    loadPieceOrThrow: async (
        { pieceName, pieceVersion, pieceSource }: LoadPieceParams,
    ): Promise<Piece> => {
        const packageName = pieceLoader.getPackageAlias({
            pieceName,
            pieceVersion,
            pieceSource,
        })
        const piecePath = await pieceLoader.getPiecePath({ packageName, pieceSource })
        const module = await import(piecePath)

        const piece = extractPieceFromModule<Piece>({
            module,
            pieceName,
            pieceVersion,
        })

        if (isNil(piece)) {
            throw new ActivepiecesError({
                code: ErrorCode.PIECE_NOT_FOUND,
                params: {
                    pieceName,
                    pieceVersion,
                    message: 'Piece not found in the engine',
                },
            })
        }

        return piece
    },

    getPieceAndTriggerOrThrow: async (params: GetPieceAndTriggerParams): Promise<{ piece: Piece, pieceTrigger: Trigger }> => {
        const { pieceName, pieceVersion, triggerName, pieceSource } = params
        const piece = await pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion, pieceSource })
        const trigger = piece.getTrigger(triggerName)

        if (trigger === undefined) {
            throw new Error(`trigger not found, pieceName=${pieceName}, triggerName=${triggerName}`)
        }

        return {
            piece,
            pieceTrigger: trigger,
        }
    },

    getPieceAndActionOrThrow: async (params: GetPieceAndActionParams): Promise<{ piece: Piece, pieceAction: Action }> => {
        const { pieceName, pieceVersion, actionName, pieceSource } = params

        const piece = await pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion, pieceSource })
        const pieceAction = piece.getAction(actionName)

        if (isNil(pieceAction)) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    pieceName,
                    pieceVersion,
                    stepName: actionName,
                },
            })
        }

        return {
            piece,
            pieceAction,
        }
    },

    getPropOrThrow: async ({ params, pieceSource }: GetPropParams) => {
        const { piece: piecePackage, actionOrTriggerName, propertyName } = params

        const piece = await pieceLoader.loadPieceOrThrow({ pieceName: piecePackage.pieceName, pieceVersion: piecePackage.pieceVersion, pieceSource })

        const actionOrTrigger = piece.getAction(actionOrTriggerName) ?? piece.getTrigger(actionOrTriggerName)

        if (isNil(actionOrTrigger)) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    pieceName: piecePackage.pieceName,
                    pieceVersion: piecePackage.pieceVersion,
                    stepName: actionOrTriggerName,
                },
            })
        }

        const prop = (actionOrTrigger.props as PiecePropertyMap)[propertyName]

        if (isNil(prop)) {
            throw new ActivepiecesError({
                code: ErrorCode.CONFIG_NOT_FOUND,
                params: {
                    pieceName: piecePackage.pieceName,
                    pieceVersion: piecePackage.pieceVersion,
                    stepName: actionOrTriggerName,
                    configName: propertyName,
                },
            })
        }

        return prop
    },

    getPackageAlias: ({ pieceName, pieceVersion, pieceSource }: GetPackageAliasParams) => {
        if (pieceSource.trim() === 'FILE') {
            return pieceName
        }

        return getPackageAliasForPiece({
            pieceName,
            pieceVersion,
        })
    },

    getPiecePath: async ({ packageName, pieceSource }: GetPiecePathParams): Promise<string> => {
        let piecePath = null
        switch (pieceSource) {
            case 'FILE':
                piecePath = await loadPieceFromDistFolder(packageName)
                break
            case 'DB':
            default:
                piecePath = await traverseAllParentFoldersToFindPiece(packageName)
                break
        }
        if (isNil(piecePath)) {
            throw new ActivepiecesError({
                code: ErrorCode.PIECE_NOT_FOUND,
                params: {
                    pieceName: packageName,
                    pieceVersion: undefined,
                    message: `Piece path not found for package: ${packageName}`,
                },
            })
        }
        return piecePath
    },
}

async function loadPieceFromDistFolder(packageName: string): Promise<string | null> {
    const distPath = path.resolve('dist/packages/pieces')
    const entries = (await utils.walk(distPath)).filter((entry) => entry.name === 'package.json')
    for (const entry of entries) {
        try {
            const packageJsonPath = entry.path
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
            const packageJson = JSON.parse(packageJsonContent)
            if (packageJson.name === packageName) {
                return path.dirname(packageJsonPath)
            }
        }
        catch (error) {
            // Skip invalid package.json files
        }
    }
    return null
}

async function traverseAllParentFoldersToFindPiece(packageName: string): Promise<string | null> {
    const rootDir = path.parse(__dirname).root
    let currentDir = __dirname
    const maxIterations = currentDir.split(path.sep).length
    for (let i = 0; i < maxIterations; i++) {
        const piecePath = path.resolve(currentDir, 'pieces', packageName, 'node_modules', packageName)
        if (await utils.folderExists(piecePath)) {
            return piecePath
        }
        const parentDir = path.dirname(currentDir)
        if (parentDir === currentDir || currentDir === rootDir) {
            break
        }
        currentDir = parentDir
    }
    return null
}

type GetPiecePathParams = {
    packageName: string
    pieceSource: string
}

type LoadPieceParams = {
    pieceName: string
    pieceVersion: string
    pieceSource: string
}

type GetPieceAndTriggerParams = {
    pieceName: string
    pieceVersion: string
    triggerName: string
    pieceSource: string
}

type GetPieceAndActionParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
    pieceSource: string
}

type GetPropParams = {
    params: ExecutePropsOptions
    pieceSource: string
}

type GetPackageAliasParams = {
    pieceName: string
    pieceSource: string
    pieceVersion: string
}

