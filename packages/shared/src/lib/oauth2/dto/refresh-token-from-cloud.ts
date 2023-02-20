import { Static, Type } from "@sinclair/typebox";

export const RefreshTokenFromCloudRequest = Type.Object({
    pieceName: Type.String({}),
    refreshToken: Type.String({}),
    tokenUrl: Type.Optional(Type.String())
});

export type RefreshTokenFromCloudRequest = Static<typeof RefreshTokenFromCloudRequest>;
