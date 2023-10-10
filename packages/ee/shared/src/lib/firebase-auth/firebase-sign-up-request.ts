import { Static, Type } from "@sinclair/typebox";

export const FirebaseSignUpRequest = Type.Object({
    token: Type.String({}),
    firstName: Type.String(),
    lastName: Type.String(),
    referringUserId: Type.Optional(Type.String()),
    trackEvents: Type.Boolean(),
    newsLetter: Type.Boolean(),
});

export type FirebaseSignUpRequest = Static<typeof FirebaseSignUpRequest>;
