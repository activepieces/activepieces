import fs from 'fs/promises'
import path from 'path'
import { Action, Piece, PiecePropertyMap, Trigger } from '@activepieces/pieces-framework'
import { ActivepiecesError, EngineGenericError, ErrorCode, extractPieceFromModule, getPackageAliasForPiece, getPieceNameFromAlias, isNil, trimVersionFromAlias } from '@activepieces/shared'
import { utils } from '../utils'

export const pieceLoader = {
    loadPieceOrThrow: async (
        { pieceName, pieceVersion, devPieces }: LoadPieceParams,
    ): Promise<Piece> => {
        const { data: piece, error: pieceError } = await utils.tryCatchAndThrowOnEngineError(async () => {
            const packageName = pieceLoader.getPackageAlias({
                pieceName,
                pieceVersion,
                devPieces,
            })
            const piecePath = await pieceLoader.getPiecePath({ packageName, devPieces })
            const module = await import(piecePath)

            const piece = extractPieceFromModule<Piece>({
                module,
                pieceName,
                pieceVersion,
            })

            if (isNil(piece)) {
                throw new EngineGenericError('PieceNotFoundError', `Piece not found for piece: ${pieceName}, pieceVersion: ${pieceVersion}`)
            }
            return piece
        })
        if (pieceError) {
            throw pieceError
        }
        return piece
    },

    getPieceAndTriggerOrThrow: async (params: GetPieceAndTriggerParams): Promise<{ piece: Piece, pieceTrigger: Trigger }> => {
        const { pieceName, pieceVersion, triggerName, devPieces } = params
        const piece = await pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion, devPieces })
        const trigger = piece.getTrigger(triggerName)

        if (trigger === undefined) {
            throw new EngineGenericError('TriggerNotFoundError', `Trigger not found, pieceName=${pieceName}, triggerName=${triggerName}`)
        }

        return {
            piece,
            pieceTrigger: trigger,
        }
    },

    getPieceAndActionOrThrow: async (params: GetPieceAndActionParams): Promise<{ piece: Piece, pieceAction: Action }> => {
        const { pieceName, pieceVersion, actionName, devPieces } = params

        const piece = await pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion, devPieces })
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

    getPropOrThrow: async ({ pieceName, pieceVersion, actionOrTriggerName, propertyName, devPieces }: GetPropParams) => {
        const piece = await pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion, devPieces })

        const actionOrTrigger = piece.getAction(actionOrTriggerName) ?? piece.getTrigger(actionOrTriggerName)

        if (isNil(actionOrTrigger)) {
            throw new ActivepiecesError({
                code: ErrorCode.STEP_NOT_FOUND,
                params: {
                    pieceName,
                    pieceVersion,
                    stepName: actionOrTriggerName,
                },
            })
        }

        const property = (actionOrTrigger.props as PiecePropertyMap)[propertyName]

        if (isNil(property)) {
            throw new ActivepiecesError({
                code: ErrorCode.CONFIG_NOT_FOUND,
                params: {
                    pieceName,
                    pieceVersion,
                    stepName: actionOrTriggerName,
                    configName: propertyName,
                },
            })
        }

        return { property, piece }
    },

    getPackageAlias: ({ pieceName, pieceVersion, devPieces }: GetPackageAliasParams) => {
        if (devPieces.includes(getPieceNameFromAlias(pieceName))) {
            return pieceName
        }

        return getPackageAliasForPiece({
            pieceName,
            pieceVersion,
        })
    },

    getPiecePath: async ({ packageName, devPieces }: GetPiecePathParams): Promise<string> => {
        const piecePath = devPieces.includes(getPieceNameFromAlias(packageName)) 
            ? await loadPieceFromDistFolder(packageName) 
            : await traverseAllParentFoldersToFindPiece(packageName)
        if (isNil(piecePath)) {
            throw new EngineGenericError('PieceNotFoundError', `Piece not found for package: ${packageName}`)
        }
        return piecePath
    },
}

async function loadPieceFromDistFolder(packageName: string): Promise<string | null> {
    const distPath = path.resolve('dist/packages/pieces')
    const entries = (await utils.walk(distPath)).filter((entry) => entry.name === 'package.json')
    for (const entry of entries) {
        const { data: packageJsonPath } = await utils.tryCatchAndThrowOnEngineError((async () => {
            const packageJsonPath = entry.path
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
            const packageJson = JSON.parse(packageJsonContent)
            if (packageJson.name === packageName) {
                return path.dirname(packageJsonPath)
            }
            return null
        }))
        if (packageJsonPath) {
            return packageJsonPath
        }
    }
    return null
}

async function traverseAllParentFoldersToFindPiece(packageName: string): Promise<string | null> {
    const rootDir = path.parse(__dirname).root
    let currentDir = __dirname
    const maxIterations = currentDir.split(path.sep).length
    for (let i = 0; i < maxIterations; i++) {
        const piecePath = path.resolve(currentDir, 'pieces', packageName, 'node_modules', trimVersionFromAlias(packageName))

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
    devPieces: string[]
}

type LoadPieceParams = {
    pieceName: string
    pieceVersion: string
    devPieces: string[]
}

type GetPieceAndTriggerParams = {
    pieceName: string
    pieceVersion: string
    triggerName: string
    devPieces: string[]
}

type GetPieceAndActionParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
    devPieces: string[]
}

type GetPropParams = {
    pieceName: string
    pieceVersion: string
    actionOrTriggerName: string
    propertyName: string
    devPieces: string[]
}

type GetPackageAliasParams = {
    pieceName: string
    devPieces: string[]
    pieceVersion: string
}

