import { Static, Type } from "@sinclair/typebox";

export const SignInRequest = Type.Object({
    email: Type.String({
        format: 'email',
    }),
    password: Type.String({
        minLength: 8,
        maxLength: 64,
    }),
});

export type SignInRequest = Static<typeof SignInRequest>;
