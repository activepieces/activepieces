import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../common'

export const GlobalOAuthApp = Type.Object({
    ...BaseModelSchema,
    pieceName: Type.String(),
    clientId: Type.String(),
})

export type GlobalOAuthApp = Static<typeof GlobalOAuthApp>

export const GlobalOAuthAppWithSecret = Type.Composite([GlobalOAuthApp, Type.Object({ clientSecret: Type.String() })])

export type GlobalOAuthAppWithSecret = Static<typeof GlobalOAuthAppWithSecret>
