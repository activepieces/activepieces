import { Static, Type } from "@sinclair/typebox";

export const SemVerType = Type.RegEx(/^[0-9]+\.[0-9]+\.[0-9]+$/);

export const GetPieceRequestQuery = Type.Object({
    version: SemVerType,
});

export type GetPieceRequestQuery = Static<typeof GetPieceRequestQuery>;
