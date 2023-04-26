import { Static, Type } from "@sinclair/typebox";
import { SemVerType } from "./get-piece-request-query";

export const PieceOptionRequest = Type.Object({
    pieceVersion: SemVerType,
    stepName: Type.String({}),
    propertyName: Type.String({}),
    input: Type.Any({})
});

export type PieceOptionRequest = Static<typeof PieceOptionRequest>;
