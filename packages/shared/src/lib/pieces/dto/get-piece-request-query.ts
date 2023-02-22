import { Static, Type } from "@sinclair/typebox";

export const GetPieceRequestQuery = Type.Object({
    version: Type.RegEx(/[0-9]+\.[0-9]+\.[0-9]+/),
});

export type GetPieceRequestQuery = Static<typeof GetPieceRequestQuery>;
