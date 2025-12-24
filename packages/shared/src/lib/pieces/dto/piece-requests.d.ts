import { Static } from '@sinclair/typebox';
import { ApEdition } from '../../flag/flag';
import { PackageType, PieceCategory } from '../piece';
export declare const EXACT_VERSION_PATTERN = "^[0-9]+\\.[0-9]+\\.[0-9]+$";
export declare const EXACT_VERSION_REGEX: RegExp;
export declare const ExactVersionType: import("@sinclair/typebox").TString;
export declare const VersionType: import("@sinclair/typebox").TString;
export declare enum SuggestionType {
    ACTION = "ACTION",
    TRIGGER = "TRIGGER",
    ACTION_AND_TRIGGER = "ACTION_AND_TRIGGER"
}
export declare enum PieceSortBy {
    NAME = "NAME",
    UPDATED = "UPDATED",
    CREATED = "CREATED",
    POPULARITY = "POPULARITY"
}
export declare enum PieceOrderBy {
    ASC = "ASC",
    DESC = "DESC"
}
export declare const GetPieceRequestWithScopeParams: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    scope: import("@sinclair/typebox").TString;
}>;
export type GetPieceRequestWithScopeParams = Static<typeof GetPieceRequestWithScopeParams>;
export declare const GetPieceRequestParams: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
}>;
export type GetPieceRequestParams = Static<typeof GetPieceRequestParams>;
export declare const ListPiecesRequestQuery: import("@sinclair/typebox").TObject<{
    release: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    includeTags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    includeHidden: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    edition: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof ApEdition>>;
    searchQuery: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    sortBy: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof PieceSortBy>>;
    orderBy: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof PieceOrderBy>>;
    categories: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof PieceCategory>>>;
    suggestionType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof SuggestionType>>;
    locale: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type ListPiecesRequestQuery = Static<typeof ListPiecesRequestQuery>;
export declare const RegistryPiecesRequestQuery: import("@sinclair/typebox").TObject<{
    release: import("@sinclair/typebox").TString;
    edition: import("@sinclair/typebox").TEnum<typeof ApEdition>;
}>;
export type RegistryPiecesRequestQuery = Static<typeof RegistryPiecesRequestQuery>;
export declare const ListVersionRequestQuery: import("@sinclair/typebox").TObject<{
    release: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    edition: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof ApEdition>>;
}>;
export type ListVersionRequestQuery = Static<typeof ListVersionRequestQuery>;
export declare const GetPieceRequestQuery: import("@sinclair/typebox").TObject<{
    version: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    projectId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    locale: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const ListVersionsResponse: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{}>>;
export type ListVersionsResponse = Static<typeof ListVersionsResponse>;
export type GetPieceRequestQuery = Static<typeof GetPieceRequestQuery>;
export declare const PieceOptionRequest: import("@sinclair/typebox").TObject<{
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    actionOrTriggerName: import("@sinclair/typebox").TString;
    propertyName: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    input: import("@sinclair/typebox").TAny;
    searchValue: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type PieceOptionRequest = Static<typeof PieceOptionRequest>;
export declare enum PieceScope {
    PLATFORM = "PLATFORM",
    PROJECT = "PROJECT"
}
export declare const AddPieceRequestBody: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    packageType: import("@sinclair/typebox").TLiteral<PackageType.ARCHIVE>;
    scope: import("@sinclair/typebox").TLiteral<PieceScope.PLATFORM>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    pieceArchive: import("@sinclair/typebox").TObject<{
        filename: import("@sinclair/typebox").TString;
        data: import("@sinclair/typebox").TUnknown;
        type: import("@sinclair/typebox").TLiteral<"file">;
        mimetype: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
}>, import("@sinclair/typebox").TObject<{
    packageType: import("@sinclair/typebox").TLiteral<PackageType.REGISTRY>;
    scope: import("@sinclair/typebox").TLiteral<PieceScope.PLATFORM>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
}>]>;
export type AddPieceRequestBody = Static<typeof AddPieceRequestBody>;
