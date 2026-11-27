import { BaseModelSchema, formErrors } from '@activepieces/core-utils'
import { z } from 'zod'

const MAX_EMBED_HOSTNAME_LENGTH = 253

export enum EmbedSubdomainStatus {
    PENDING_VERIFICATION = 'PENDING_VERIFICATION',
    ACTIVE = 'ACTIVE',
    FAILED = 'FAILED',
}

export enum EmbedVerificationRecordType {
    CNAME = 'CNAME',
    TXT = 'TXT',
}

export enum EmbedVerificationRecordPurpose {
    HOSTNAME = 'HOSTNAME',
    OWNERSHIP = 'OWNERSHIP',
    SSL = 'SSL',
}

export const EmbedVerificationRecord = z.object({
    type: z.enum([EmbedVerificationRecordType.CNAME, EmbedVerificationRecordType.TXT]),
    name: z.string(),
    value: z.string(),
    purpose: z.enum([
        EmbedVerificationRecordPurpose.HOSTNAME,
        EmbedVerificationRecordPurpose.OWNERSHIP,
        EmbedVerificationRecordPurpose.SSL,
    ]),
})

export type EmbedVerificationRecord = z.infer<typeof EmbedVerificationRecord>

export const EmbedSubdomain = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    hostname: z.string(),
    status: z.enum([
        EmbedSubdomainStatus.PENDING_VERIFICATION,
        EmbedSubdomainStatus.ACTIVE,
        EmbedSubdomainStatus.FAILED,
    ]),
    cloudflareId: z.string(),
    verificationRecords: z.array(EmbedVerificationRecord),
})

export type EmbedSubdomain = z.infer<typeof EmbedSubdomain>

export const GenerateEmbedSubdomainRequest = z.object({
    hostname: z.hostname(formErrors.invalidEmbedHostname)
        .min(4, formErrors.invalidEmbedHostname)
        .max(MAX_EMBED_HOSTNAME_LENGTH, formErrors.invalidEmbedHostname)
        .refine((value) => value.includes('.'), formErrors.invalidEmbedHostname)
        .refine((value) => value === value.toLowerCase(), formErrors.invalidEmbedHostname),
})

export type GenerateEmbedSubdomainRequest = z.infer<typeof GenerateEmbedSubdomainRequest>
