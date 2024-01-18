import { Static, Type } from '@sinclair/typebox'
import { ApEdition } from '../../flag/flag'
import { PackageType, PieceType } from '../piece'

export const EXACT_VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+$/
export const VERSION_PATTERN = /^([~^])?[0-9]+\.[0-9]+\.[0-9]+$/

export const ExactVersionType = Type.RegEx(EXACT_VERSION_PATTERN)
export const VersionType = Type.RegEx(VERSION_PATTERN)

export const GetPieceRequestWithScopeParams = Type.Object({
    name: Type.String(),
    scope: Type.String(),
})

export type GetPieceRequestWithScopeParams = Static<typeof GetPieceRequestWithScopeParams>


export const GetPieceRequestParams = Type.Object({
    name: Type.String(),
})

export type GetPieceRequestParams = Static<typeof GetPieceRequestParams>

export const ListPiecesRequestQuery = Type.Object({
    release: Type.Optional(ExactVersionType),
    includeHidden: Type.Optional(Type.Boolean()),
    edition: Type.Optional(Type.Enum(ApEdition)),
})

export type ListPiecesRequestQuery = Static<typeof ListPiecesRequestQuery>


export const GetPieceRequestQuery = Type.Object({
    version: Type.Optional(VersionType),
})

export type GetPieceRequestQuery = Static<typeof GetPieceRequestQuery>

export const PieceOptionRequest = Type.Object({
    packageType: Type.Enum(PackageType),
    pieceType: Type.Enum(PieceType),
    pieceName: Type.String({}),
    pieceVersion: VersionType,
    stepName: Type.String({}),
    propertyName: Type.String({}),
    input: Type.Any({}),
})

export type PieceOptionRequest = Static<typeof PieceOptionRequest>

export const AddPieceRequestBody = Type.Object({
    platformId: Type.Optional(Type.String()),
    packageType: Type.Enum(PackageType),
    pieceName: Type.String(),
    pieceVersion: ExactVersionType,

    /**
     * buffer of the npm package tarball if any
     */
    pieceArchive: Type.Optional(Type.Unknown()),
})

export type AddPieceRequestBody = Static<typeof AddPieceRequestBody>
