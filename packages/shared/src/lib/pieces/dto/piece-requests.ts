import { Static, Type } from "@sinclair/typebox";
import { semVerRegex } from "../../common";

export const SemVerType = Type.RegEx(semVerRegex);

export const GetPieceRequestParams = Type.Object({
    name: Type.RegEx(/^[A-Za-z0-9_\\-]+$/),
});

export type GetPieceRequestParams = Static<typeof GetPieceRequestParams>;


export const GetPieceRequestQuery = Type.Object({
    version: SemVerType,
});

export type GetPieceRequestQuery = Static<typeof GetPieceRequestQuery>;

export const PieceOptionRequest = Type.Object({
    pieceVersion: SemVerType,
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