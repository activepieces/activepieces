import { Static, Type } from "@sinclair/typebox";

export const GetPieceRequestParams = Type.Object({
    name: Type.RegEx(/^[A-Za-z0-9_]+$/),
});

export type GetPieceRequestParams = Static<typeof GetPieceRequestParams>;
