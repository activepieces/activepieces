import { Static, Type } from "@sinclair/typebox";

export const ClaimTokenFromCloudRequest = Type.Object({
    pieceName: Type.String({}),
    tokenUrl: Type.String({}),
    code: Type.String({}),
});

export type ClaimTokenFromCloudRequest = Static<typeof ClaimTokenFromCloudRequest>;
