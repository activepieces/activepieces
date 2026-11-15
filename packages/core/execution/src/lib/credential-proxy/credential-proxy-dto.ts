import { z } from 'zod'

export enum CredentialProxyPolicy {
    PERMISSIVE = 'PERMISSIVE',
    STRICT = 'STRICT',
}

export enum CredentialDelivery {
    PLACEHOLDER = 'PLACEHOLDER',
    REAL = 'REAL',
}

export const CredentialGrantField = z.object({
    index: z.number().int().nonnegative(),
    path: z.array(z.string()),
})
export type CredentialGrantField = z.infer<typeof CredentialGrantField>

export const CredentialGrantRecord = z.object({
    grantId: z.string(),
    platformId: z.string(),
    projectId: z.string(),
    jobId: z.string(),
    connectionExternalId: z.string(),
    pieceName: z.string(),
    pieceVersion: z.string(),
    fields: z.array(CredentialGrantField),
    allowedHosts: z.array(z.string()),
    allowAnyHost: z.boolean(),
    expiresAt: z.number(),
})
export type CredentialGrantRecord = z.infer<typeof CredentialGrantRecord>

export const ResolveCredentialGrantRequest = z.object({
    grantId: z.string(),
})
export type ResolveCredentialGrantRequest = z.infer<typeof ResolveCredentialGrantRequest>

export const ResolvedCredentialField = z.object({
    index: z.number().int().nonnegative(),
    value: z.string(),
})
export type ResolvedCredentialField = z.infer<typeof ResolvedCredentialField>

export const ResolveCredentialGrantResponse = z.object({
    grantId: z.string(),
    pieceName: z.string().optional(),
    fields: z.array(ResolvedCredentialField),
    allowedHosts: z.array(z.string()),
    allowAnyHost: z.boolean(),
    expiresAt: z.number(),
})
export type ResolveCredentialGrantResponse = z.infer<typeof ResolveCredentialGrantResponse>
