import { Static, Type } from "@sinclair/typebox";

export const GetPieceRequestQuery = Type.Object({
    version: Type.String({}),
});

export type GetPieceRequestQuery = Static<typeof GetPieceRequestQuery>;
