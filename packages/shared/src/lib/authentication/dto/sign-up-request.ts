import { Static, Type } from "@sinclair/typebox";

export const SignUpRequest = Type.Object({
    email: Type.String({
        format: 'email',
    }),
    password: Type.String({
        minLength: 8,
        maxLength: 25,
    }),
    firstName: Type.String(),
    lastName: Type.String(),
    trackEvents: Type.Boolean(),
    newsLetter: Type.Boolean(),
});

export type SignUpRequest = Static<typeof SignUpRequest>;
