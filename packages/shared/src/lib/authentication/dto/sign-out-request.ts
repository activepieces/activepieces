import { Static, Type } from '@sinclair/typebox'

export const SignOutRequest = Type.Object({
    token: Type.String(),
})

export type SignOutRequest = Static<typeof SignOutRequest>
