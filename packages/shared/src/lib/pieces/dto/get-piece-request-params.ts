import { Static, Type } from "@sinclair/typebox";

export const GetPieceRequestParams = Type.Object({
    name: Type.String({}),
});

export type GetPieceRequestParams = Static<typeof GetPieceRequestParams>;
