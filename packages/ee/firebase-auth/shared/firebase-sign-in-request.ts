import { Static, Type } from "@sinclair/typebox";

export const FirebaseSignInRequest = Type.Object({
    token: Type.String({})
});

export type FirebaseSignInRequest = Static<typeof FirebaseSignInRequest>;
