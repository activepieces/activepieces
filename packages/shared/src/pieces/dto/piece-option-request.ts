import { Static, Type } from "@sinclair/typebox";

export const PieceOptionRequest = Type.Object({
    stepName: Type.String({}),
    propertyName: Type.String({}),
    input: Type.Any({}),
    collectionVersionId: Type.String({})
});

export type PieceOptionRequest = Static<typeof PieceOptionRequest>;
