import { isNil } from '@activepieces/core-utils'
import { getAuthPropertyForValue, PieceAuthProperty, PropertyType } from '@activepieces/pieces-framework'
import { AppConnectionType, AppConnectionValue, PiecePackage } from '@activepieces/shared'
import { EngineConstants } from '../../handler/context/engine-constants'
import { PieceDescription } from './piece-protocol'
import { PieceRef, pieceRunner } from './piece-runner'

export const pieceAuth = {
    callMethod: async ({ operation, authValueType, methodPath }: CallMethodParams): Promise<AuthCallResult> => {
        const piece: PieceRef = {
            pieceName: operation.piece.pieceName,
            pieceVersion: operation.piece.pieceVersion,
            devPieces: EngineConstants.DEV_PIECES,
        }
        const description = await pieceRunner.describe(piece)
        const selected = select({ description, authValueType })
        if (isNil(selected)) {
            return { called: false }
        }
        const path = [...selected.path, ...methodPath]
        if (!description.hasPath(path)) {
            return { called: false, property: selected.property }
        }
        const argument = argumentFor({ property: selected.property, value: operation.auth })
        if (isNil(argument)) {
            return { called: false, property: selected.property, mismatch: true }
        }
        const server = {
            apiUrl: operation.internalApiUrl.endsWith('/') ? operation.internalApiUrl : `${operation.internalApiUrl}/`,
            publicUrl: operation.publicApiUrl,
        }
        return {
            called: true,
            property: selected.property,
            result: (await pieceRunner.call({ piece, path, args: [{ auth: argument.argument, server }] })).result,
        }
    },
}

function select({ description, authValueType }: SelectParams): SelectedAuth | undefined {
    const auth = description.metadata.auth
    if (isNil(auth)) {
        return undefined
    }
    const property = getAuthPropertyForValue({ authValueType, pieceAuth: auth })
    if (isNil(property)) {
        return undefined
    }
    const index = Array.isArray(auth) ? auth.indexOf(property) : -1
    return {
        property,
        path: index === -1 ? ['auth'] : ['auth', String(index)],
    }
}

function argumentFor({ property, value }: ArgumentParams): { argument: unknown } | undefined {
    switch (property.type) {
        case PropertyType.OAUTH2:
            return [AppConnectionType.OAUTH2, AppConnectionType.CLOUD_OAUTH2, AppConnectionType.PLATFORM_OAUTH2].includes(value.type) ? { argument: value } : undefined
        case PropertyType.BASIC_AUTH:
            return value.type === AppConnectionType.BASIC_AUTH ? { argument: value } : undefined
        case PropertyType.SECRET_TEXT:
            return value.type === AppConnectionType.SECRET_TEXT ? { argument: value.secret_text } : undefined
        case PropertyType.CUSTOM_AUTH:
            return value.type === AppConnectionType.CUSTOM_AUTH ? { argument: value.props } : undefined
        case PropertyType.OIDC:
            return value.type === AppConnectionType.OIDC ? { argument: value.props } : undefined
        default:
            return undefined
    }
}

type SelectParams = {
    description: PieceDescription
    authValueType: AppConnectionType
}

type ArgumentParams = {
    property: PieceAuthProperty
    value: AppConnectionValue
}

type SelectedAuth = {
    property: PieceAuthProperty
    path: string[]
}

type CallMethodParams = {
    operation: {
        piece: PiecePackage
        auth: AppConnectionValue
        internalApiUrl: string
        publicApiUrl: string
    }
    authValueType: AppConnectionType
    methodPath: string[]
}

export type AuthCallResult =
    | { called: false, property?: PieceAuthProperty, mismatch?: boolean }
    | { called: true, property: PieceAuthProperty, result: unknown }
