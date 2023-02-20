import { Static, Type } from "@sinclair/typebox";

export const ClaimTokenFromCloudRequest = Type.Object({
    pieceName: Type.String({}),
    code: Type.String({}),
    tokenUrl: Type.Optional(Type.String())
});

export type ClaimTokenFromCloudRequest = Static<typeof ClaimTokenFromCloudRequest>;
