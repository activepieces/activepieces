import { z } from 'zod'
import { AppCredentialType } from './app-credentials'

export const ListAppCredentialsRequest = z.object({
    projectId: z.string(),
    appName: z.string().optional(),
    limit: z.coerce.number().optional(),
    cursor: z.string().optional(),
})


export type ListAppCredentialsRequest = z.infer<typeof ListAppCredentialsRequest>

export const UpsertApiKeyCredentialRequest = z.object({
    id: z.string().optional(),
    appName: z.string(),
    projectId: z.string(),
    settings: z.object({
        type: z.literal(AppCredentialType.API_KEY),
    }),
})


export const UpsertOAuth2CredentialRequest = z.object({
    id: z.string().optional(),
    appName: z.string(),
    projectId: z.string(),
    settings: z.object({
        type: z.literal(AppCredentialType.OAUTH2),
        authUrl: z.string(),
        scope: z.string(),
        tokenUrl: z.string(),
        clientId: z.string(),
        clientSecret: z.string(),
    }),
})

export const UpsertAppCredentialRequest = z.union([UpsertOAuth2CredentialRequest, UpsertApiKeyCredentialRequest])

export type UpsertAppCredentialRequest = z.infer<typeof UpsertAppCredentialRequest>
