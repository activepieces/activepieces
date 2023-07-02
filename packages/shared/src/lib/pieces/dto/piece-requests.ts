import { Static, Type } from "@sinclair/typebox";
 
const semVerRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const queryVersionRegex = /^(\^)?[0-9]+\.[0-9]+\.[0-9]+$/;

export const SemVerType = Type.RegEx(semVerRegex);
export const QueryVerType = Type.RegEx(queryVersionRegex);

export const GetPieceRequestWithScopeParams = Type.Object({
    name: Type.String(),
    scope: Type.String(),
});

export type GetPieceRequestWithScopeParams = Static<typeof GetPieceRequestWithScopeParams>;


export const GetPieceRequestParams = Type.Object({
    name: Type.String(),
});

export type GetPieceRequestParams = Static<typeof GetPieceRequestParams>;

export const ListPiecesRequestQuery = Type.Object({
    release: Type.Optional(SemVerType),
});

export type ListPiecesRequestQuery = Static<typeof ListPiecesRequestQuery>;


export const GetPieceRequestQuery = Type.Object({
    version: Type.Optional(QueryVerType),
});

export type GetPieceRequestQuery = Static<typeof GetPieceRequestQuery>;

export const PieceOptionRequest = Type.Object({
    pieceVersion: QueryVerType,
    pieceName: Type.String({}),
    stepName: Type.String({}),
    propertyName: Type.String({}),
    input: Type.Any({})
});

export type PieceOptionRequest = Static<typeof PieceOptionRequest>;

export const InstallPieceRequest = Type.Object({
    pieceName: Type.String(),
    pieceVersion: SemVerType,
})

export type InstallPieceRequest = Static<typeof InstallPieceRequest>