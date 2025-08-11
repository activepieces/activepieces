import { Static, Type } from '@sinclair/typebox'
import { ApMultipartFile } from '../../common'
import { ApEdition } from '../../flag/flag'
import { PackageType, PieceCategory } from '../piece'

export const EXACT_VERSION_PATTERN = '^[0-9]+\\.[0-9]+\\.[0-9]+$'
export const EXACT_VERSION_REGEX = new RegExp(EXACT_VERSION_PATTERN)
const VERSION_PATTERN = '^([~^])?[0-9]+\\.[0-9]+\\.[0-9]+$'

export const ExactVersionType = Type.String({
    pattern: EXACT_VERSION_PATTERN,
})
export const VersionType = Type.String({
    pattern: VERSION_PATTERN,
})
export enum SuggestionType {
    ACTION = 'ACTION',
    TRIGGER = 'TRIGGER',
    ACTION_AND_TRIGGER = 'ACTION_AND_TRIGGER',
}
export enum PieceSortBy {
    NAME = 'NAME',
    UPDATED = 'UPDATED',
    CREATED = 'CREATED',
    POPULARITY = 'POPULARITY',
}

export enum PieceOrderBy {
    ASC = 'ASC',
    DESC = 'DESC',
}

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
    includeTags: Type.Optional(Type.Boolean()),
    includeHidden: Type.Optional(Type.Boolean()),
    edition: Type.Optional(Type.Enum(ApEdition)),
    searchQuery: Type.Optional(Type.String()),
    sortBy: Type.Optional(Type.Enum(PieceSortBy)),
    orderBy: Type.Optional(Type.Enum(PieceOrderBy)),
    categories: Type.Optional(Type.Array(Type.Enum(PieceCategory))),
    suggestionType: Type.Optional(Type.Enum(SuggestionType)),
    locale: Type.Optional(Type.String()),
})

export type ListPiecesRequestQuery = Static<typeof ListPiecesRequestQuery>

export const ListVersionRequestQuery = Type.Object({
    release: ExactVersionType,
    name: Type.String(),
    edition: Type.Optional(Type.Enum(ApEdition)),
})

export type ListVersionRequestQuery = Static<typeof ListVersionRequestQuery>

export const GetPieceRequestQuery = Type.Object({
    version: Type.Optional(VersionType),
    projectId: Type.Optional(Type.String()),
    locale: Type.Optional(Type.String()),
})

export const ListVersionsResponse = Type.Record(ExactVersionType, Type.Object({}))
export type ListVersionsResponse = Static<typeof ListVersionsResponse>

export type GetPieceRequestQuery = Static<typeof GetPieceRequestQuery>

export const PieceOptionRequest = Type.Object({
    pieceName: Type.String({}),
    pieceVersion: VersionType,
    actionOrTriggerName: Type.String({}),
    propertyName: Type.String({}),
    flowId: Type.String(),
    flowVersionId: Type.String(),
    input: Type.Any({}),
    searchValue: Type.Optional(Type.String()),
})

export type PieceOptionRequest = Static<typeof PieceOptionRequest>

export enum PieceScope {
    PLATFORM = 'PLATFORM',
    // TODO: all users have their own platform, so we can remove this
    // @deprecated
    PROJECT = 'PROJECT',

}

export const AddPieceRequestBody = Type.Union([
    Type.Object({
        packageType: Type.Literal(PackageType.ARCHIVE),
        scope: Type.Literal(PieceScope.PLATFORM),
        pieceName: Type.String({
            minLength: 1,
        }),
        pieceVersion: ExactVersionType,
        pieceArchive: ApMultipartFile,
    }, {
        title: 'Private Piece',
    }),
    Type.Object({
        packageType: Type.Literal(PackageType.REGISTRY),
        scope: Type.Literal(PieceScope.PLATFORM),
        pieceName: Type.String({
            minLength: 1,
        }),
        pieceVersion: ExactVersionType,
    }, {
        title: 'NPM Piece',
    }),
])

export type AddPieceRequestBody = Static<typeof AddPieceRequestBody>
