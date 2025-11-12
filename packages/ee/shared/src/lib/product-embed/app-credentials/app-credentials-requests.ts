import { Static, Type } from '@sinclair/typebox'
import { AppCredentialType } from './app-credentials'

export const ListAppCredentialsRequest = Type.Object({
    projectId: Type.String(),
    appName: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
    cursor: Type.Optional(Type.String({})),
})


export type ListAppCredentialsRequest = Static<typeof ListAppCredentialsRequest>
