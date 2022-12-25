import { Static, Type } from "@sinclair/typebox";

export const AuthenticationRequest = Type.Object({
    email: Type.String({
        format: 'email',
    }),
    password: Type.String({
        minLength: 8,
        maxLength: 25,
    }),
});

export type AuthenticationRequest = Static<typeof AuthenticationRequest>;
